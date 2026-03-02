/**
 * 动态背景 Canvas 动画 - 粒子连线效果
 */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

// 配置参数
const config = {
    particleCount: 60,
    connectionDistance: 150,
    speed: 0.5,
    colorLight: 'rgba(0, 0, 0, ',
    colorDark: 'rgba(255, 255, 255, '
};

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // 边界反弹
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw(colorBase) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = colorBase + '0.5)';
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    
    // 检测当前主题
    const isDark = document.body.classList.contains('theme-dark');
    const colorBase = isDark ? config.colorDark : config.colorLight;

    particles.forEach((p, index) => {
        p.update();
        p.draw(colorBase);

        // 连线逻辑
        for (let j = index + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.connectionDistance) {
                ctx.beginPath();
                ctx.strokeStyle = colorBase + (1 - distance / config.connectionDistance) * 0.2 + ')';
                ctx.lineWidth = 1;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });

    requestAnimationFrame(animate);
}

// 初始化
window.addEventListener('resize', () => {
    resize();
    initParticles();
});

resize();
initParticles();
animate();