import { Component, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, IonContent } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { ContratacionesService } from '../../../services/contrataciones.service';
import { User, MensajeChat, Contratacion } from '../../../models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class ChatPage implements OnInit, AfterViewChecked {
  @ViewChild(IonContent) content!: IonContent;

  contratacionId!: string;
  currentUser$: Observable<User | null>;
  mensajes$: Observable<MensajeChat[]>;
  contratacion: Contratacion | null = null;
  newMessage = '';
  currentUserId = '';
  asesorId = '';
  isLoading = true;
  shouldScroll = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService,
    private contratacionesService: ContratacionesService
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.mensajes$ = new Observable(subscriber => subscriber.next([])); // Inicializar vacío
  }

  ngOnInit() {
    this.contratacionId = this.route.snapshot.paramMap.get('contratacionId') || '';

    this.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.id;
        this.contratacionesService.getContratacionById(this.contratacionId).subscribe(
          contratacion => {
            if (contratacion) {
              this.contratacion = contratacion;
              this.asesorId = contratacion.usuario_id === user.id ? '' : contratacion.usuario_id;
              this.mensajes$ = this.chatService.subscribeToConversacion(this.contratacionId);
              this.isLoading = false;
            }
          }
        );
      }
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.contratacion) {
      return;
    }

    const message = this.newMessage;
    this.newMessage = '';
    this.shouldScroll = true;

    this.chatService.sendMessage(
      this.contratacionId,
      this.currentUserId,
      this.asesorId,
      message
    ).subscribe(
      result => {
        if (result) {
          console.log('✅ Mensaje enviado');

        } else {
          console.error('❌ Error enviando mensaje');
        }
      }
    );
  }

  private scrollToBottom() {
    if (this.content) {
      this.content.scrollToBottom(200);
    }
  }

  goBack() {
    this.router.navigate(['/mis-contrataciones']);
    this.chatService.unsubscribeFromConversacion(this.contratacionId);
  }

  isMessageFromCurrentUser(usuarioId: string): boolean {
    return usuarioId === this.currentUserId;
  }
}
