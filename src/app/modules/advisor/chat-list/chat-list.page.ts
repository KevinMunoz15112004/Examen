import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { ChatService } from '../../../services/chat.service';
import { User, ConversacionChat } from '../../../models';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-chat-list',
  templateUrl: './chat-list.page.html',
  styleUrls: ['./chat-list.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ChatListPage implements OnInit {
  conversaciones$: Observable<ConversacionChat[]>;
  currentUser$: Observable<User | null>;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.getCurrentUser();
    this.conversaciones$ = this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          return this.chatService.getConversaciones(user.id, true);
        }
        return Promise.resolve([]);
      })
    );
  }

  ngOnInit() {
    this.isLoading = false;
  }

  goBack() {
    this.router.navigate(['/advisor/dashboard']);
  }

  goToChat(contratacionId: string) {
    this.router.navigate(['/advisor/chat', contratacionId]);
  }
}
