import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SplashPage implements OnInit {
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    setTimeout(() => {
      this.authService.isAuthenticated().subscribe(isAuth => {
        if (isAuth) {
          this.authService.isAdvisor().subscribe(isAdvisor => {
            if (isAdvisor) {
              this.router.navigate(['/advisor/dashboard']);
            } else {
              this.router.navigate(['/home']);
            }
          });
        } else {
          this.router.navigate(['/catalog']);
        }
      });
    }, 2000);
  }
}
