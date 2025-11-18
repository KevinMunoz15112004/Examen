import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlanesService } from '../../../services/planes.service';
import { StorageService } from '../../../services/storage.service';
import { AuthService } from '../../../services/auth.service';
import { Plan, User } from '../../../models';
import { ToastController, IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-plan-form',
  templateUrl: './plan-form.page.html',
  styleUrls: ['./plan-form.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule]
})
export class PlanFormPage implements OnInit {
  planForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  editingPlanId: string | null = null;
  selectedImage: File | null = null;
  imagePreview: string | null = null;
  plan: Plan | null = null;
  currentUser: User | null = null;

  segmentos = ['Básico', 'Medio', 'Premium'];

  constructor(
    private fb: FormBuilder,
    private planesService: PlanesService,
    private storageService: StorageService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user!;
    });

    this.editingPlanId = this.route.snapshot.paramMap.get('id');
    if (this.editingPlanId) {
      this.loadPlan(this.editingPlanId);
    } else {
      this.isLoading = false;
    }
  }

  private initializeForm() {
    this.planForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      precio: ['', [Validators.required, Validators.min(0)]],
      segmento: ['', Validators.required],
      datos_moviles: ['', Validators.required],
      minutos_voz: ['', Validators.required],
      sms: ['', Validators.required],
      velocidad_4g: ['', Validators.required],
      velocidad_5g: [''],
      redes_sociales: ['', Validators.required],
      whatsapp: ['', Validators.required],
      llamadas_internacionales: ['', Validators.required],
      roaming: ['', Validators.required],
      activo: [true]
    });
  }

  private loadPlan(id: string) {
    this.planesService.getPlanById(id).subscribe(
      plan => {
        if (plan) {
          this.plan = plan;
          this.planForm.patchValue(plan);
          if (plan.imagen_url) {
            this.imagePreview = plan.imagen_url;
          }
        }
        this.isLoading = false;
      },
      error => {
        console.error('Error cargando plan:', error);
        this.presentToast('Error al cargar el plan', 'danger');
        this.goBack();
      }
    );
  }

  onImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async submitForm() {
    if (this.planForm.invalid) {
      await this.presentToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.isSubmitting = true;
    const formData = this.planForm.value;
    let imageUrl = this.plan?.imagen_url || null;

    // Subir imagen si hay una nueva (OPCIONAL - no bloqueará la creación)
    if (this.selectedImage && this.currentUser) {
      const uploadedUrl = await this.storageService.uploadPlanImage(
        this.selectedImage,
        this.editingPlanId || 'new'
      );
      
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        await this.presentToast('No se pudo subir la imagen, el plan se creará sin imagen', 'warning');
      }
    }

    if (this.editingPlanId && this.currentUser) {
      const updateData = {
        ...formData,
        imagen_url: imageUrl
      };

      this.planesService.updatePlan(this.editingPlanId, updateData).subscribe(
        async result => {
          this.isSubmitting = false;
          if (result) {
            await this.presentToast('¡Plan actualizado exitosamente!', 'success');
            this.goBack();
          } else {
            await this.presentToast('Error al actualizar el plan', 'danger');
          }
        }
      );
    } else if (this.currentUser) {
      const newPlan = {
        ...formData,
        imagen_url: imageUrl || null, 
        created_by: this.currentUser.id
      };

      this.planesService.createPlan(newPlan).subscribe(
        async result => {
          this.isSubmitting = false;
          if (result) {
            await this.presentToast('¡Plan creado exitosamente!', 'success');
            this.goBack();
          } else {
            await this.presentToast('Error al crear el plan', 'danger');
          }
        }
      );
    }
  }

  goBack() {
    this.router.navigate(['/advisor/dashboard']);
  }

  private async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
