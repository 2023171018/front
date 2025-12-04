// login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  // Usuarios predefinidos
  private users = [
    { email: 'admin@gmail.com', password: 'admin123', role: 'admin' },
    { email: 'user@gmail.com', password: 'user123', role: 'user' }
  ];

  constructor(private router: Router) {}

  login() {
    const user = this.users.find(u => u.email === this.email && u.password === this.password);

    if (user) {
      this.error = '';
      // redirigir al dashboard
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Usuario o contraseña incorrectos';
    }
  }
}
