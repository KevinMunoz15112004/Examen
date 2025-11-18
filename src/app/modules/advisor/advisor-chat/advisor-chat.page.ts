import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { User, MensajeChat } from '../../../models';
import { Observable, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'app-advisor-chat',
  templateUrl: './advisor-chat.page.html',
  styleUrls: ['./advisor-chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class AdvisorChatPage implements OnInit, OnDestroy {
  @ViewChild('messageList') messageList!: ElementRef;

  currentUser$: Observable<User | null>;
  mensajes$: Observable<MensajeChat[]>;
  contratacionId: string = '';
  nuevoMensaje: string = '';
  isLoading = true;
  private destroy$ = new Subject<void>();
  private pollingInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.mensajes$ = new Observable();
  }

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.contratacionId = params['id'];
      console.log('📧 Cargando chat para contratación:', this.contratacionId);
      
      this.mensajes$ = this.chatService.getMensajes(this.contratacionId, true);
      this.isLoading = false;
      
      setTimeout(() => this.scrollToBottom(), 300);
    });
  }

  ionViewDidEnter() {
    console.log('Entrando a chat del asesor, iniciando polling...');
    this.startPolling();
  }

  ionViewDidLeave() {
    console.log('Saliendo de chat del asesor, deteniendo polling...');
    this.stopPolling();
  }

  private startPolling() {
    if (this.pollingInterval) {
      return; 
    }
    
    this.pollingInterval = setInterval(() => {
      this.mensajes$ = this.chatService.getMensajes(this.contratacionId, true);
    }, 3000);
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  isMessageFromAdvisor(asesorId: string | null): boolean {
    return asesorId !== null;
  }

  scrollToBottom() {
    if (this.messageList) {
      this.messageList.nativeElement.scrollTop = 
        this.messageList.nativeElement.scrollHeight;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack() {
    this.router.navigate(['/advisor/chat-list']);
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim()) {
      return;
    }

    this.currentUser$.pipe(take(1)).subscribe((user: User | null) => {
      if (!user) {
        console.error('Usuario no autenticado');
        return;
      }

      console.log('Enviando mensaje:', this.nuevoMensaje);
      
      this.chatService.enviarMensajeAsesor(
        this.contratacionId,
        user.id,
        this.nuevoMensaje
      ).subscribe(
        success => {
          if (success) {
            this.nuevoMensaje = '';
            console.log('Mensaje enviado');
          }
        },
        error => {
          console.error('Error enviando mensaje:', error);
        }
      );
    });
  }
}
