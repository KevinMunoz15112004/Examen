import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ToastController, IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, IonicModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AuthPage implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  showRegister = false;
  isLoadingLogin = false;
  isLoadingRegister = false;
  selectedRole: 'usuario' | 'asesor' | null = null;
  showRoleSelection = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initializeForms();
  }

  private initializeForms() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  async login() {
    if (this.loginForm.invalid) {
      await this.presentToast('Por favor completa el formulario correctamente', 'warning');
      return;
    }

    if (!this.selectedRole) {
      await this.presentToast('Selecciona un tipo de acceso', 'warning');
      return;
    }

    this.isLoadingLogin = true;
    const { email, password } = this.loginForm.value;

    if (this.selectedRole === 'usuario') {
      this.loginAsUser(email, password);
    } else if (this.selectedRole === 'asesor') {
      this.loginAsAdvisor(email, password);
    }
  }

  private loginAsUser(email: string, password: string) {
    this.authService.login(email, password).subscribe(
      async response => {
        this.isLoadingLogin = false;
        if (response.error) {
          await this.presentToast(response.error, 'danger');
        } else {
          this.authService.isAdvisor().subscribe(async isAdvisor => {
            if (!isAdvisor) {
              await this.presentToast('¡Bienvenido!', 'success');
              this.router.navigate(['/home']);
              this.resetAuth();
            } else {
              await this.authService.logout();
              this.isLoadingLogin = false;
              await this.presentToast('Este usuario no tiene permisos de usuario normal', 'danger');
            }
          });
        }
      },
      async error => {
        this.isLoadingLogin = false;
        await this.presentToast('Error al iniciar sesión', 'danger');
      }
    );
  }

  private loginAsAdvisor(email: string, password: string) {
    this.authService.loginAdvisor(email, password).subscribe(
      async response => {
        this.isLoadingLogin = false;
        if (response.error) {
          await this.presentToast(response.error, 'danger');
        } else if (response.user) {
          await this.presentToast('¡Bienvenido Asesor!', 'success');
          setTimeout(() => {
            this.router.navigate(['/advisor/dashboard']).then(() => {
              this.resetAuth();
            });
          }, 300);
        }
      },
      async error => {
        this.isLoadingLogin = false;
        console.error('Login advisor error:', error);
        await this.presentToast('Credenciales de asesor no válidas', 'danger');
      }
    );
  }

  selectRole(role: 'usuario' | 'asesor') {
    this.selectedRole = role;
    this.showRoleSelection = false;
    this.loginForm.reset();
  }

  goBackToRoleSelection() {
    this.selectedRole = null;
    this.showRoleSelection = true;
    this.loginForm.reset();
    this.showRegister = false;
  }

  async register() {
    if (this.registerForm.invalid) {
      await this.presentToast('Por favor completa el formulario correctamente', 'warning');
      return;
    }

    this.isLoadingRegister = true;
    const { fullName, email, phone, password } = this.registerForm.value;

    this.authService.register(email, password, fullName, phone).subscribe(
      async response => {
        this.isLoadingRegister = false;
        if (response.error) {
          await this.presentToast(response.error, 'danger');
        } else {
          await this.presentToast('¡Registro exitoso! Inicia sesión ahora', 'success');
          this.registerForm.reset();
          this.showRegister = false;
          this.loginForm.reset();
        }
      },
      async error => {
        this.isLoadingRegister = false;
        await this.presentToast('Error al registrarse', 'danger');
      }
    );
  }

  private resetAuth() {
    this.selectedRole = null;
    this.showRoleSelection = true;
    this.showRegister = false;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  private async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
