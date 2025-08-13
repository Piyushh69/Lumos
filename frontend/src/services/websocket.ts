export class WebSocketService {
  private socket: WebSocket | null = null;

  connect(url: string) {
    this.socket = new WebSocket(url);
    
    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}