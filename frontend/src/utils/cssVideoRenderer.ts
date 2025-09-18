// CSS-based video rendering utility
export class CSSVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;

  constructor(width: number = 1920, height: number = 1080) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Create a hidden container for CSS animations
    this.container = document.createElement('div');
    this.container.style.position = 'absolute';
    this.container.style.left = '-9999px';
    this.container.style.top = '-9999px';
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
    this.container.style.visibility = 'hidden';
    document.body.appendChild(this.container);
  }

  // Render a CSS animation frame to canvas
  renderFrame(animationComponent: React.ReactElement, frame: number, totalFrames: number) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set frame on container for CSS frame-based animation
    this.container.setAttribute('data-frame', frame.toString());
    
    // Create a temporary div to render the animation
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '100%';
    tempDiv.style.height = '100%';
    this.container.appendChild(tempDiv);
    
    // Render the animation component (this would need React rendering)
    // For now, we'll create a simple CSS animation directly
    this.renderLogoSplitFrame(frame, totalFrames);
    
    // Convert the rendered content to canvas
    this.convertElementToCanvas(tempDiv);
    
    // Clean up
    this.container.removeChild(tempDiv);
    
    return this.canvas;
  }

  private renderLogoSplitFrame(frame: number, totalFrames: number) {
    const progress = frame / totalFrames;
    
    // Clear canvas with background
    this.ctx.fillStyle = '#184cb4';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate positions based on frame
    const leftProgress = Math.min(1, progress * 2); // First half of animation
    const rightProgress = Math.min(1, Math.max(0, (progress - 0.5) * 2)); // Second half
    const centerProgress = Math.min(1, Math.max(0, (progress - 0.3) * 2)); // Center appears
    
    // Draw left logo
    if (leftProgress > 0) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(
        0, 
        this.canvas.height / 2 - 100, 
        (this.canvas.width / 2) * leftProgress, 
        200
      );
      
      // Add text
      this.ctx.fillStyle = '#184cb4';
      this.ctx.font = '48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        'Your Logo', 
        (this.canvas.width / 4) * leftProgress, 
        this.canvas.height / 2 + 20
      );
    }
    
    // Draw right logo
    if (rightProgress > 0) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(
        this.canvas.width / 2 + (this.canvas.width / 2) * (1 - rightProgress), 
        this.canvas.height / 2 - 100, 
        (this.canvas.width / 2) * rightProgress, 
        200
      );
      
      // Add text
      this.ctx.fillStyle = '#184cb4';
      this.ctx.font = '48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        'Your Logo', 
        this.canvas.width / 2 + (this.canvas.width / 4) * rightProgress, 
        this.canvas.height / 2 + 20
      );
    }
    
    // Draw center logo
    if (centerProgress > 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, ' + centerProgress + ')';
      this.ctx.font = '72px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(
        'Your Logo', 
        this.canvas.width / 2, 
        this.canvas.height / 2 + 30
      );
    }
  }

  private convertElementToCanvas(element: HTMLElement) {
    // This would use html2canvas or similar to convert DOM to canvas
    // For now, we're using direct canvas drawing
  }

  // Clean up resources
  destroy() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
