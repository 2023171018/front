import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface TelemetryData {
  _id: string;
  temperature: number;
  humidity: number;
  timestamp: string;
  __v: number;
}

interface UpdateStatus {
  ultimoTiempo: number;
  ultimaConsulta: string | null;
  proximaActualizacion: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {

  temperature: number = 0;
  humidity: number = 0;
  telemetryData: TelemetryData[] = [];
  updateStatus: UpdateStatus | null = null;

  private apiUrl = 'https://backend-51r4.onrender.com/api';
  private telemetryInterval: any;
  private statusInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTelemetry();
    this.loadUpdateStatus();

    // Actualizar telemetría cada 5 segundos
    this.telemetryInterval = setInterval(() => this.loadTelemetry(), 5000);

    // Actualizar estado de actualización cada 3 segundos
    this.statusInterval = setInterval(() => this.loadUpdateStatus(), 3000);
  }

  ngOnDestroy(): void {
    // Limpiar intervalos al destruir el componente
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  loadTelemetry() {
    this.http.get<TelemetryData[]>(`${this.apiUrl}/telemetry/all`)
      .subscribe({
        next: (data) => {
          if (data.length > 0) {
            // Ordenar por timestamp descendente (más reciente primero)
            this.telemetryData = [...data].sort((a, b) => {
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            // El más reciente ahora está en la posición 0
            const latest = this.telemetryData[0];
            this.temperature = latest.temperature;
            this.humidity = latest.humidity;
          }
        },
        error: (e) => {
          console.error('Error cargando telemetría:', e);
          this.telemetryData = [];
        }
      });
  }

  loadUpdateStatus() {
    this.http.get<UpdateStatus>(`${this.apiUrl}/update/status`)
      .subscribe({
        next: (data) => {
          this.updateStatus = data;
        },
        error: (e) => {
          console.error('Error cargando estado de actualización:', e);
          this.updateStatus = null;
        }
      });
  }

  // Formatea la fecha para mostrar solo hora del INTERVALO (no modificar)
  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = hours % 12 || 12;
      return `${hour12.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    } catch {
      return '---';
    }
  }

  // Formatea la hora del HISTORIAL (sumar 6 horas y 2 segundos)
  formatHistoryTime(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      // Sumar 6 horas para ajustar a hora de México
      date.setHours(date.getHours() + 6);
      // Sumar 2 segundos extra
      date.setSeconds(date.getSeconds() + 2);
      
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = hours % 12 || 12;
      return `${hour12.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    } catch {
      return '---';
    }
  }

  // Formatea la fecha completa (DD/MM/YYYY)
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '---';
    }
  }
}