// CSS-based video rendering utility
export class CSSVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private width: number;
  private height: number;

  constructor(width: number = 1920, height: number = 1080) {
    this.width = width;
    this.height = height;
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
    this.container.style.overflow = 'hidden';
    this.container.className = 'logo-split-canvas';
    document.body.appendChild(this.container);
  }

  // Render a CSS animation frame to canvas
  renderFrame(animationData: any, frame: number, totalFrames: number) {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Set frame on container for CSS frame-based animation
    this.container.setAttribute('data-frame', frame.toString());
    
    // Update CSS custom properties
    this.container.style.setProperty('--customer-bg-color', animationData.backgroundColor || '#fca5a5');
    this.container.style.setProperty('--logo-scale', (animationData.logoScale || 1).toString());
    
    // Render the animation directly to canvas
    this.renderLogoSplitFrame(frame, totalFrames, animationData);
    
    return this.canvas;
  }

  private renderLogoSplitFrame(frame: number, totalFrames: number, animationData: any) {
    const progress = frame / totalFrames;
    const backgroundColor = animationData.backgroundColor || '#fca5a5';
    const salesforceColor = '#3b82f6';
    
    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate animation phases
    const inPhase = Math.min(1, progress * 3); // First 1/3 of animation
    const holdPhase = Math.min(1, Math.max(0, (progress - 0.33) * 3)); // Middle 1/3
    const outPhase = Math.min(1, Math.max(0, (progress - 0.66) * 3)); // Last 1/3
    
    // Draw customer background circle
    if (inPhase > 0) {
      const customerScale = inPhase;
      const customerX = this.width * 0.25; // 25% from left
      const customerY = this.height * 0.5;
      const customerRadius = Math.min(this.width, this.height) * 0.8 * customerScale;
      
      this.ctx.fillStyle = backgroundColor;
      this.ctx.beginPath();
      this.ctx.arc(customerX, customerY, customerRadius, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    
    // Draw Salesforce background circle
    if (inPhase > 0) {
      const salesforceX = this.width * 0.75; // 75% from left
      const salesforceY = this.height * 0.5;
      const salesforceRadius = Math.min(this.width, this.height) * 0.8;
      
      this.ctx.fillStyle = salesforceColor;
      this.ctx.beginPath();
      this.ctx.arc(salesforceX, salesforceY, salesforceRadius, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    
    // Draw customer logo circle
    if (inPhase > 0) {
      const logoScale = inPhase;
      const logoX = this.width * 0.25;
      const logoY = this.height * 0.5;
      const logoRadius = 200 * logoScale;
      
      // White circle
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(logoX, logoY, logoRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Add shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetY = 4;
      this.ctx.fill();
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetY = 0;
      
      // Logo text
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 48px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Customer', logoX, logoY - 20);
      this.ctx.fillText('Logo', logoX, logoY + 20);
    }
    
    // Draw Salesforce logo circle
    if (inPhase > 0) {
      const logoScale = inPhase;
      const logoX = this.width * 0.75;
      const logoY = this.height * 0.5;
      const logoRadius = 200 * logoScale;
      
      // White circle
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(logoX, logoY, logoRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Add shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowOffsetY = 4;
      this.ctx.fill();
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetY = 0;
      
      // Logo text
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 48px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Salesforce', logoX, logoY - 20);
      this.ctx.fillText('Logo', logoX, logoY + 20);
    }
    
    // Handle out phase (slide out)
    if (outPhase > 0) {
      // Apply slide out transform
      const slideOffset = outPhase * this.width;
      
      // Redraw everything with slide offset
      this.ctx.save();
      this.ctx.translate(-slideOffset, 0);
      
      // Redraw customer side
      const customerX = this.width * 0.25;
      const customerY = this.height * 0.5;
      const customerRadius = Math.min(this.width, this.height) * 0.8;
      
      this.ctx.fillStyle = backgroundColor;
      this.ctx.beginPath();
      this.ctx.arc(customerX, customerY, customerRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Redraw Salesforce side
      const salesforceX = this.width * 0.75;
      const salesforceY = this.height * 0.5;
      const salesforceRadius = Math.min(this.width, this.height) * 0.8;
      
      this.ctx.fillStyle = salesforceColor;
      this.ctx.beginPath();
      this.ctx.arc(salesforceX, salesforceY, salesforceRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      
      // Redraw logos
      const logoRadius = 200;
      
      // Customer logo
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(customerX, customerY, logoRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 48px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Customer', customerX, customerY - 20);
      this.ctx.fillText('Logo', customerX, customerY + 20);
      
      // Salesforce logo
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(salesforceX, salesforceY, logoRadius, 0, 2 * Math.PI);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#333';
      this.ctx.font = 'bold 48px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Salesforce', salesforceX, salesforceY - 20);
      this.ctx.fillText('Logo', salesforceX, salesforceY + 20);
      
      this.ctx.restore();
    }
  }

  // Clean up resources
  destroy() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}