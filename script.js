const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.closePath();
        c.fillStyle = this.color;
        c.fill();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.closePath();
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.targetRadius = radius;
        this.shrinkSpeed = 0.8;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.closePath();
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if (this.targetRadius < this.radius) {
            this.radius = this.radius - this.shrinkSpeed < this.targetRadius ? this.targetRadius : this.radius - this.shrinkSpeed;
        }
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.friction = 0.985;
        this.timeToLive = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.timeToLive;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.closePath();
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.timeToLive -= 0.01;
    }
}
let overlayMenu = document.getElementById("overlayMenu")
let smallScore = document.getElementById("smallScore")
let bigScore = document.getElementById("bigScore")
let btnStartGame = document.getElementById("btnStartGame");
let player = new Player(canvas.width / 2, canvas.height / 2, 15, "#E3EAEF")
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;
let animationID;
let spawnEnemiesID;

function init() {
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    bigScore.innerHTML = score;
    smallScore.innerHTML = score;
    clearInterval(spawnEnemiesID);
}

function spawnEnemies() {
    spawnEnemiesID = setInterval(() => {
        let x, y, velocity;
        let radius = Math.floor(Math.random() * (40 - 10 + 1)) + 10;

        // Random position
        if (Math.random() > 0.5) {
            x = Math.random() * canvas.width;
            y = Math.random() > 0.5 ? canvas.height + radius : 0 - radius;
        } else {
            x = Math.random() > 0.5 ? canvas.width + radius : 0 - radius;
            y = Math.random() * canvas.height;
        }

        // Random speed
        let angle = Math.atan2((canvas.height / 2) - y, (canvas.width / 2) - x);
        if (radius > 35) {
            velocity = {
                x: Math.cos(angle) * 0.95,
                y: Math.sin(angle) * 0.95
            }
        } else if (radius < 20) {
            velocity = {
                x: Math.cos(angle) * 1.3,
                y: Math.sin(angle) * 1.3
            }
        } else {
            velocity = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            }
        }

        // Random color
        let color = `hsl(${Math.random() * 360},50%, 50%)`
        enemies.push(new Enemy(x, y, radius, color, velocity))
    }, 500)
}

function animate() {
    animationID = requestAnimationFrame(animate);
    c.fillStyle = "rgba(0, 0, 0, 0.25)"
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    // Draw projectiles
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();

        // Remove projectiles
        if (projectiles[i].x - projectiles[i].radius < 0 || projectiles[i].x - projectiles[i].radius > canvas.width || projectiles[i].y + projectiles[i].radius < 0 || projectiles[i].y - projectiles[i].radius > canvas.height) {
            projectiles.splice(i, 1)
            i--;
            continue;
        }
    }

    // Draw enemies
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();

        // Collision between enemy and player
        let distance = Math.hypot(enemies[i].x - player.x, enemies[i].y - player.y)
        if (distance - enemies[i].radius - player.radius < 0) {
            cancelAnimationFrame(animationID);
            clearInterval(spawnEnemiesID);
            bigScore.innerHTML = score;
            overlayMenu.style.display = "flex";
        }


        // Collision between enemy and projectile
        for (let j = 0; j < projectiles.length; j++) {
            if (Boolean(enemies[i])) {
                let distance = Math.hypot(enemies[i].x - projectiles[j].x, enemies[i].y - projectiles[j].y)
                if (distance - enemies[i].radius < 0) {
                    //Explosion
                    for (let k = 0; k < enemies[i].radius * 2; k++) {
                        let radius = Math.random() * 3;
                        let velocity = {
                            x: Math.floor(Math.random() * (6 - (-6) + 1)) + (-6),
                            y: Math.floor(Math.random() * (6 - (-6) + 1)) + (-6)
                        }
                        particles.push(new Particle(enemies[i].x, enemies[i].y, radius, enemies[i].color, velocity));
                    }

                    // Shrink and remove enemy / projectile
                    if (enemies[i].radius - 14 > 8) {
                        score += 100;
                        smallScore.innerText = score;
                        enemies[i].targetRadius -= 14;
                        projectiles.splice(j, 1);
                        j--;
                        continue;
                    } else {
                        score += 250;
                        smallScore.innerText = score;
                        enemies.splice(i, 1);
                        projectiles.splice(j, 1);
                        i--;
                        j--;
                        continue;
                    }
                }
            }
        }

        // Final check / remove enemy
        if (Boolean(enemies[i]) && enemies[i].radius < 8) {
            enemies.splice(i, 1);
            i--;
            continue;
        }
    }

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();

        if (particles[i].timeToLive <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

addEventListener("click", (event) => {
    let angle = Math.atan2(event.clientY - (canvas.height / 2), event.clientX - (canvas.width / 2))
    let velocity = {
        x: Math.cos(angle) * 6,
        y: Math.sin(angle) * 6
    }
    projectiles.push(new Projectile(canvas.width / 2, canvas.height / 2, 5, "#E3EAEF", velocity))
})

btnStartGame.addEventListener("click", () => {
    init();
    overlayMenu.style.display = "none";
    animate();
    spawnEnemies();
})
