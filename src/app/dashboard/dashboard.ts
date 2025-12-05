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
    console.log('🚀 Dashboard iniciado');
    
    // Cargar datos iniciales
    this.loadTelemetry();
    this.loadUpdateStatus();

    // Actualizar telemetría cada 5 segundos
    this.telemetryInterval = setInterval(() => {
      console.log('🔄 Actualizando telemetría...');
      this.loadTelemetry();
    }, 5000);

    // Actualizar estado de actualización cada 3 segundos
    this.statusInterval = setInterval(() => {
      console.log('🔄 Actualizando estado de intervalo...');
      this.loadUpdateStatus();
    }, 3000);
  }

  ngOnDestroy(): void {
    console.log('🛑 Dashboard destruido - Limpiando intervalos');
    
    // Limpiar intervalos al destruir el componente
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  /**
   * Carga todos los datos de telemetría desde el backend
   */
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

            console.log('✅ Telemetría cargada:', {
              temperatura: latest.temperature,
              humedad: latest.humidity,
              timestamp: latest.timestamp,
              total: data.length
            });
          } else {
            console.warn('⚠️ No hay datos de telemetría disponibles');
            this.telemetryData = [];
          }
        },
        error: (e) => {
          console.error('❌ Error cargando telemetría:', e);
          this.telemetryData = [];
        }
      });
  }

  /**
   * Carga el estado actual del intervalo desde el backend
   */
  loadUpdateStatus() {
    this.http.get<UpdateStatus>(`${this.apiUrl}/update/status`)
      .subscribe({
        next: (data) => {
          this.updateStatus = data;
          
          console.log('✅ Estado de intervalo cargado:', {
            intervalo: data.ultimoTiempo,
            ultimaConsulta: data.ultimaConsulta,
            proximaActualizacion: data.proximaActualizacion
          });
        },
        error: (e) => {
          console.error('❌ Error cargando estado de actualización:', e);
          this.updateStatus = null;
        }
      });
  }

  /**
   * Formatea la hora para el INTERVALO (Última consulta y Próxima lectura)
   * Muestra hora local sin ajustes
   */
  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      
      // Obtener componentes de tiempo
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      // Formato 12 horas
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = hours % 12 || 12;
      
      return `${hour12.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
      console.error('Error formateando hora:', error);
      return '---';
    }
  }

  /**
   * Formatea la hora del HISTORIAL de telemetría
   * Aplica ajuste de +6 horas para hora de México
   */
  formatHistoryTime(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      
      // Ajuste a hora de México: +6 horas
      date.setHours(date.getHours() + 6);
      
      const hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      // Formato 12 horas
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = hours % 12 || 12;
      
      return `${hour12.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    } catch (error) {
      console.error('Error formateando hora del historial:', error);
      return '---';
    }
  }

  /**
   * Formatea la fecha completa en formato DD/MM/YYYY
   */
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return '---';
    }
  }

  /**
   * Obtiene el color del estado según el intervalo
   * Útil para mostrar indicadores visuales
   */
  getStatusColor(): string {
    if (!this.updateStatus || !this.updateStatus.ultimoTiempo) {
      return 'text-gray-500';
    }

    const tiempo = this.updateStatus.ultimoTiempo;
    
    if (tiempo <= 10) {
      return 'text-green-500'; // Intervalo rápido
    } else if (tiempo <= 30) {
      return 'text-yellow-500'; // Intervalo medio
    } else {
      return 'text-orange-500'; // Intervalo lento
    }
  }

  /**
   * Calcula el tiempo restante hasta la próxima actualización
   */
  getTimeRemaining(): string {
    if (!this.updateStatus?.proximaActualizacion) {
      return '---';
    }

    try {
      const now = new Date();
      const next = new Date(this.updateStatus.proximaActualizacion);
      const diff = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));

      if (diff === 0) {
        return 'Ahora';
      } else if (diff === 1) {
        return '1 segundo';
      } else {
        return `${diff} segundos`;
      }
    } catch {
      return '---';
    }
  }

  /**
   * Verifica si el sistema está activo (ha habido consultas recientes)
   */
  isSystemActive(): boolean {
    if (!this.updateStatus?.ultimaConsulta) {
      return false;
    }

    try {
      const lastUpdate = new Date(this.updateStatus.ultimaConsulta);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
      
      // Sistema activo si la última consulta fue hace menos de 2 minutos
      return diffMinutes < 2;
    } catch {
      return false;
    }
  }
}