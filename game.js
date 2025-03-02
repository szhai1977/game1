const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');

// 设置画布大小
canvas.width = 320;
canvas.height = 480;

// 添加键盘控制状态
const controls = {
    up: false,
    down: false,
    shoot: false
};

// 修改飞船配置，移除重力
const bird = {
    x: 50,
    y: canvas.height / 2,
    velocity: 0,
    moveSpeed: 3,      // 添加移动速度
    size: 35,
    rotation: 0,
    engineFlame: 0,
    shootCooldown: 0
};

// 游戏变量
let pipes = [];
let score = 0;
let gameRunning = true;

// 修改怪物类型配置，删除麻雀
const monsterTypes = [
    {
        name: '鹰',
        color: '#4B4B4B',
        size: 32,
        speed: 0.3,
        points: 20,
        spawnChance: 0.4,  // 增加生成概率以补充麻雀的缺失
        maxHealth: 4,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 150;
            const wingAngle = Math.sin(time) * 0.3;
            
            // 身体
            const bodyGradient = ctx.createLinearGradient(x - size, y - size/2, x + size, y + size/2);
            bodyGradient.addColorStop(0, '#2F4F4F');
            bodyGradient.addColorStop(0.5, '#4B4B4B');
            bodyGradient.addColorStop(1, '#363636');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.5, size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // 翅膀
            const wingGradient = ctx.createLinearGradient(0, -size, 0, size);
            wingGradient.addColorStop(0, '#4B4B4B');
            wingGradient.addColorStop(0.5, '#696969');
            wingGradient.addColorStop(1, '#2F4F4F');
            
            // 左翼
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(wingAngle);
            ctx.fillStyle = wingGradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(size * 0.8, -size * 0.6, size, 0);
            ctx.quadraticCurveTo(size * 0.8, size * 0.6, 0, 0);
            ctx.fill();
            ctx.restore();

            // 头部
            ctx.fillStyle = '#2F4F4F';
            ctx.beginPath();
            ctx.arc(x - size * 0.4, y - size * 0.1, size * 0.25, 0, Math.PI * 2);
            ctx.fill();

            // 眼睛
            const eyeGradient = ctx.createRadialGradient(
                x - size * 0.6, y - size * 0.15, 0,
                x - size * 0.6, y - size * 0.15, size * 0.08
            );
            eyeGradient.addColorStop(0, '#FFD700');
            eyeGradient.addColorStop(1, '#DAA520');
            ctx.fillStyle = eyeGradient;
            ctx.beginPath();
            ctx.arc(x - size * 0.6, y - size * 0.15, size * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // 钩喙
            ctx.fillStyle = '#2F2F2F';
            ctx.beginPath();
            ctx.moveTo(x - size * 0.65, y - size * 0.1);
            ctx.quadraticCurveTo(x - size * 0.75, y, x - size * 0.6, y + size * 0.05);
            ctx.quadraticCurveTo(x - size * 0.65, y - size * 0.05, x - size * 0.55, y - size * 0.1);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        name: '白鸽',
        color: '#FFFFFF',
        size: 20,
        speed: 0.45,
        points: 15,
        spawnChance: 0.3,
        maxHealth: 3,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 120;
            const wingAngle = Math.sin(time) * 0.4;
            const bodyBob = Math.sin(time * 2) * 1.5;

            // 身体
            const bodyGradient = ctx.createLinearGradient(x - size, y, x + size, y);
            bodyGradient.addColorStop(0, '#FFFFFF');
            bodyGradient.addColorStop(0.5, '#F0F0F0');
            bodyGradient.addColorStop(1, '#FFFFFF');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y + bodyBob, size * 0.55, size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // 翅膀
            const wingGradient = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
            wingGradient.addColorStop(0, '#FFFFFF');
            wingGradient.addColorStop(1, '#E0E0E0');

            // 左翼
            ctx.save();
            ctx.translate(x, y + bodyBob);
            ctx.rotate(wingAngle);
            ctx.fillStyle = wingGradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-size * 0.8, -size * 0.4, -size * 0.3, 0);
            ctx.quadraticCurveTo(-size * 0.8, size * 0.4, 0, 0);
            ctx.fill();
            ctx.restore();

            // 头部
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x - size * 0.35, y + bodyBob - size * 0.1, size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            // 眼睛
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x - size * 0.45, y + bodyBob - size * 0.15, size * 0.05, 0, Math.PI * 2);
            ctx.fill();

            // 嘴
            ctx.fillStyle = '#FFB6C1';
            ctx.beginPath();
            ctx.moveTo(x - size * 0.55, y + bodyBob - size * 0.1);
            ctx.lineTo(x - size * 0.45, y + bodyBob - size * 0.13);
            ctx.lineTo(x - size * 0.45, y + bodyBob - size * 0.07);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        name: '金丝雀',
        color: '#FFD700',
        size: 18,
        speed: 0.5,
        points: 15,
        spawnChance: 0.2,
        maxHealth: 2,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 90;
            const wingAngle = Math.sin(time) * 0.6;
            const bodyBob = Math.sin(time * 2) * 1.5;

            // 身体
            const bodyGradient = ctx.createLinearGradient(x - size, y, x + size, y);
            bodyGradient.addColorStop(0, '#FFD700');
            bodyGradient.addColorStop(0.5, '#FFFF00');
            bodyGradient.addColorStop(1, '#FFD700');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y + bodyBob, size * 0.55, size * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            // 装饰性羽毛
            ctx.fillStyle = '#FFA500';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    x - size * 0.2 + i * size * 0.2,
                    y + bodyBob - size * 0.2,
                    size * 0.1,
                    size * 0.15,
                    Math.PI / 4,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            // 翅膀动画
            const drawWing = (isLeft) => {
                ctx.save();
                ctx.translate(x, y + bodyBob);
                ctx.rotate(isLeft ? wingAngle : -wingAngle);
                if (!isLeft) ctx.scale(-1, 1);

                const wingGradient = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
                wingGradient.addColorStop(0, '#FFD700');
                wingGradient.addColorStop(1, '#DAA520');
                ctx.fillStyle = wingGradient;

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-size * 0.6, -size * 0.4, -size * 0.2, 0);
                ctx.quadraticCurveTo(-size * 0.6, size * 0.4, 0, 0);
                ctx.fill();
                ctx.restore();
            };

            drawWing(true);
            drawWing(false);

            // 头部
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(x - size * 0.3, y + bodyBob - size * 0.1, size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            // 眼睛
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(x - size * 0.4, y + bodyBob - size * 0.15, size * 0.05, 0, Math.PI * 2);
            ctx.fill();

            // 小嘴
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.moveTo(x - size * 0.5, y + bodyBob - size * 0.1);
            ctx.lineTo(x - size * 0.4, y + bodyBob - size * 0.15);
            ctx.lineTo(x - size * 0.4, y + bodyBob - size * 0.05);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        name: '孔雀',
        color: '#4169E1',
        size: 40,
        speed: 0.25,
        points: 30,
        spawnChance: 0.1,
        maxHealth: 5,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 200;
            const tailAngle = Math.sin(time) * 0.1;
            
            // 身体
            const bodyGradient = ctx.createLinearGradient(x - size, y, x + size, y);
            bodyGradient.addColorStop(0, '#4169E1');
            bodyGradient.addColorStop(0.5, '#1E90FF');
            bodyGradient.addColorStop(1, '#4169E1');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();

            // 孔雀尾巴 - 调整位置到后方
            const featherColors = ['#4169E1', '#32CD32', '#FFD700', '#9370DB'];
            ctx.save();
            ctx.translate(x + size * 0.3, y);  // 改为加号，移到后方
            ctx.rotate(tailAngle + Math.PI);   // 添加 Math.PI 旋转180度
            
            for (let i = 0; i < 7; i++) {
                const angle = (i - 3) * Math.PI / 12;
                const color = featherColors[i % featherColors.length];
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(
                    -size * Math.cos(angle) * 1.2,
                    size * Math.sin(angle) * 0.8,
                    -size * Math.cos(angle) * 1.5,
                    size * Math.sin(angle)
                );
                ctx.quadraticCurveTo(
                    -size * Math.cos(angle) * 1.2,
                    size * Math.sin(angle) * 1.2,
                    0, 0
                );
                ctx.fill();

                // 羽毛眼
                const eyeX = -size * Math.cos(angle) * 1.2;
                const eyeY = size * Math.sin(angle) * 0.9;
                const eyeGradient = ctx.createRadialGradient(
                    eyeX, eyeY, 0,
                    eyeX, eyeY, size * 0.15
                );
                eyeGradient.addColorStop(0, '#4169E1');
                eyeGradient.addColorStop(0.5, '#32CD32');
                eyeGradient.addColorStop(1, '#FFD700');
                
                ctx.fillStyle = eyeGradient;
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, size * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // 头部和冠冕 - 调整到前方
            ctx.fillStyle = '#4169E1';
            ctx.beginPath();
            ctx.arc(x - size * 0.4, y - size * 0.1, size * 0.25, 0, Math.PI * 2);  // 改为减号
            ctx.fill();

            // 冠冕 - 调整位置
            ctx.fillStyle = '#32CD32';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    x - size * 0.4 + Math.cos(i * Math.PI/3) * size * 0.1,  // 改为减号
                    y - size * 0.3 + Math.sin(i * Math.PI/3) * size * 0.1,
                    size * 0.08,
                    size * 0.15,
                    i * Math.PI/3,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            // 眼睛 - 调整位置
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(x - size * 0.5, y - size * 0.15, size * 0.05, 0, Math.PI * 2);  // 改为减号
            ctx.fill();

            // 喙 - 调整位置和方向
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(x - size * 0.6, y - size * 0.1);  // 改为减号
            ctx.lineTo(x - size * 0.7, y - size * 0.05);  // 改为减号
            ctx.lineTo(x - size * 0.6, y);  // 改为减号
            ctx.fill();

            ctx.restore();
        }
    }
];

// 添加怪物数组
let monsters = [];

// 添加子弹配置
const bulletConfig = {
    speed: 5,
    size: 4,
    cooldown: 15  // 射击冷却时间
};

// 添加子弹数组
let bullets = [];

// 初始化游戏
function init() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.shootCooldown = 0;
    monsters = [];
    bullets = [];
    score = 0;
    gameRunning = true;
    gameOverElement.classList.add('hidden');
    updateScore();
}

function updateScore() {
    scoreElement.textContent = `得分: ${score}`;
}

// 修改创建怪物函数，添加生命值
function createMonster() {
    const selectedType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    
    monsters.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - selectedType.size * 2) + selectedType.size,
        ...selectedType,
        health: selectedType.maxHealth  // 初始生命值等于最大生命值
    });
}

// 添加射击函数
function shoot() {
    if (!gameRunning || bird.shootCooldown > 0) return;
    
    bullets.push({
        x: bird.x + bird.size/2,
        y: bird.y,
        trail: []  // 子弹尾迹
    });
    
    bird.shootCooldown = bulletConfig.cooldown;
}

// 添加键盘事件监听
document.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.down = true;
            break;
        case 'Space':
            controls.shoot = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
            controls.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            controls.down = false;
            break;
        case 'Space':
            controls.shoot = false;
            break;
    }
});

// 更新游戏状态
function update() {
    if (!gameRunning) return;

    // 更新射击冷却
    if (bird.shootCooldown > 0) {
        bird.shootCooldown--;
    }

    // 处理键盘控制
    if (controls.up && bird.y > bird.size/2) {
        bird.y -= bird.moveSpeed;
    }
    if (controls.down && bird.y < canvas.height - bird.size/2) {
        bird.y += bird.moveSpeed;
    }
    if (controls.shoot) {
        shoot();
    }

    // 更新飞船旋转角度
    if (controls.up) {
        bird.rotation = -Math.PI/12;  // 向上倾斜
    } else if (controls.down) {
        bird.rotation = Math.PI/12;   // 向下倾斜
    } else {
        bird.rotation = 0;            // 保持水平
    }

    // 更新怪物位置
    for (let i = monsters.length - 1; i >= 0; i--) {
        const monster = monsters[i];
        monster.x -= monster.speed;

        // 检查与飞机的碰撞
        if (checkMonsterCollision(bird, monster)) {
            gameOver();
            return;
        }

        // 删除超出屏幕的怪物
        if (monster.x + monster.size < 0) {
            monsters.splice(i, 1);
        }
    }

    // 随机生成怪物
    if (Math.random() < 0.01 && monsters.length < 3) {
        createMonster();
    }

    // 更新子弹位置
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.x += bulletConfig.speed;
        
        // 记录尾迹
        bullet.trail.push({x: bullet.x, y: bullet.y});
        if (bullet.trail.length > 5) {
            bullet.trail.shift();
        }

        // 检查子弹与怪物的碰撞
        for (let j = monsters.length - 1; j >= 0; j--) {
            const monster = monsters[j];
            if (checkBulletCollision(bullet, monster)) {
                // 减少怪物生命值
                monster.health--;
                bullets.splice(i, 1);

                // 如果生命值为0，移除怪物并加分
                if (monster.health <= 0) {
                    score += monster.points;
                    updateScore();
                    monsters.splice(j, 1);
                }
                break;
            }
        }

        // 删除超出屏幕的子弹
        if (bullet.x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制天空背景
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');    // 天空蓝
    skyGradient.addColorStop(0.5, '#B0E2FF');  // 淡蓝色
    skyGradient.addColorStop(1, '#E0FFFF');    // 非常淡的蓝色
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制飞船
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);  // 直接使用计算好的旋转角度

    // 引擎火焰效果
    bird.engineFlame += 0.2;
    const flameSize = Math.sin(bird.engineFlame) * 10;
    const flameGradient = ctx.createLinearGradient(
        -bird.size - 20, 0,
        -bird.size, 0
    );
    flameGradient.addColorStop(0, 'rgba(0, 191, 255, 0)');
    flameGradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
    flameGradient.addColorStop(1, 'rgba(0, 191, 255, 0.4)');
    
    // 主引擎火焰
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.moveTo(-bird.size, -8);
    ctx.lineTo(-bird.size - 25 - flameSize, 0);
    ctx.lineTo(-bird.size, 8);
    ctx.closePath();
    ctx.fill();

    // 机翼引擎火焰
    const smallFlameSize = flameSize * 0.6;
    ctx.beginPath();
    ctx.moveTo(-bird.size * 0.7, -bird.size * 0.6);
    ctx.lineTo(-bird.size * 0.9 - smallFlameSize, -bird.size * 0.6);
    ctx.lineTo(-bird.size * 0.7, -bird.size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-bird.size * 0.7, bird.size * 0.6);
    ctx.lineTo(-bird.size * 0.9 - smallFlameSize, bird.size * 0.6);
    ctx.lineTo(-bird.size * 0.7, bird.size * 0.5);
    ctx.closePath();
    ctx.fill();

    // 主机翼
    const wingGradient = ctx.createLinearGradient(0, -bird.size, 0, bird.size);
    wingGradient.addColorStop(0, '#D0D0D0');
    wingGradient.addColorStop(0.5, '#F8F8F8');
    wingGradient.addColorStop(1, '#D0D0D0');
    ctx.fillStyle = wingGradient;

    // 上机翼
    ctx.beginPath();
    ctx.moveTo(-bird.size * 0.3, -bird.size * 0.3);
    ctx.lineTo(bird.size * 0.3, -bird.size * 0.5);
    ctx.lineTo(bird.size * 0.5, -bird.size * 0.4);
    ctx.lineTo(-bird.size * 0.4, -bird.size * 0.2);
    ctx.closePath();
    ctx.fill();

    // 下机翼
    ctx.beginPath();
    ctx.moveTo(-bird.size * 0.3, bird.size * 0.3);
    ctx.lineTo(bird.size * 0.3, bird.size * 0.5);
    ctx.lineTo(bird.size * 0.5, bird.size * 0.4);
    ctx.lineTo(-bird.size * 0.4, bird.size * 0.2);
    ctx.closePath();
    ctx.fill();

    // 机翼装饰线
    ctx.strokeStyle = '#A0A0A0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-bird.size * 0.3, -bird.size * 0.3);
    ctx.lineTo(bird.size * 0.3, -bird.size * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-bird.size * 0.3, bird.size * 0.3);
    ctx.lineTo(bird.size * 0.3, bird.size * 0.5);
    ctx.stroke();

    // 飞船主体
    const bodyGradient = ctx.createLinearGradient(0, -bird.size/2, 0, bird.size/2);
    bodyGradient.addColorStop(0, '#C0C0C0');   // 亮银色
    bodyGradient.addColorStop(0.3, '#FFFFFF');  // 白色
    bodyGradient.addColorStop(0.7, '#C0C0C0');
    bodyGradient.addColorStop(1, '#A0A0A0');   // 暗银色

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.size, bird.size/3, 0, 0, Math.PI * 2);  // 椭圆形主体
    ctx.fill();

    // 驾驶舱穹顶
    const cockpitGradient = ctx.createRadialGradient(
        bird.size/3, -bird.size/4,
        0,
        bird.size/3, -bird.size/4,
        bird.size/2
    );
    cockpitGradient.addColorStop(0, 'rgba(135, 206, 250, 0.9)');  // 天蓝色
    cockpitGradient.addColorStop(0.5, 'rgba(135, 206, 250, 0.5)');
    cockpitGradient.addColorStop(1, 'rgba(135, 206, 250, 0.2)');

    ctx.fillStyle = cockpitGradient;
    ctx.beginPath();
    ctx.ellipse(bird.size/3, -bird.size/4, bird.size/3, bird.size/4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 装饰环
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.size * 0.7 * (i/3), (bird.size/3) * 0.7 * (i/3), 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 侧翼
    ctx.fillStyle = '#A0A0A0';
    ctx.beginPath();
    ctx.moveTo(-bird.size/2, -bird.size/3);
    ctx.lineTo(-bird.size/2, bird.size/3);
    ctx.lineTo(-bird.size*0.8, bird.size/2);
    ctx.lineTo(-bird.size*0.8, -bird.size/2);
    ctx.closePath();
    ctx.fill();

    // 机翼尖端发光
    const wingTipGlow = ctx.createRadialGradient(
        bird.size * 0.5, -bird.size * 0.4, 0,
        bird.size * 0.5, -bird.size * 0.4, bird.size * 0.2
    );
    wingTipGlow.addColorStop(0, 'rgba(135, 206, 250, 0.3)');
    wingTipGlow.addColorStop(1, 'rgba(135, 206, 250, 0)');
    
    ctx.fillStyle = wingTipGlow;
    ctx.beginPath();
    ctx.arc(bird.size * 0.5, -bird.size * 0.4, bird.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(bird.size * 0.5, bird.size * 0.4, bird.size * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 绘制怪物
    monsters.forEach(monster => {
        monster.drawShape(ctx, monster.x, monster.y, monster.size);

        // 绘制血条背景
        const healthBarWidth = monster.size * 1.2;
        const healthBarHeight = 4;
        const healthBarX = monster.x - healthBarWidth/2;
        const healthBarY = monster.y - monster.size - 10;

        ctx.fillStyle = '#FF0000';
        ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

        // 绘制当前血量
        const currentHealthWidth = (monster.health / monster.maxHealth) * healthBarWidth;
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);

        // 绘制血条边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    });

    // 绘制子弹
    bullets.forEach(bullet => {
        // 绘制子弹尾迹
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 69, 0, 0.5)';
        ctx.lineWidth = 2;
        if (bullet.trail.length > 1) {
            ctx.moveTo(bullet.trail[0].x, bullet.trail[0].y);
            for (let i = 1; i < bullet.trail.length; i++) {
                ctx.lineTo(bullet.trail[i].x, bullet.trail[i].y);
            }
            ctx.stroke();
        }

        // 绘制子弹主体
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(bullet.x + bulletConfig.size * 2, bullet.y);
        ctx.lineTo(bullet.x - bulletConfig.size, bullet.y - bulletConfig.size/2);
        ctx.lineTo(bullet.x - bulletConfig.size, bullet.y + bulletConfig.size/2);
        ctx.closePath();
        ctx.fill();
    });
}

// 添加怪物碰撞检测
function checkMonsterCollision(bird, monster) {
    const dx = bird.x - monster.x;
    const dy = bird.y - monster.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (bird.size/3 + monster.size/2);
}

// 添加子弹碰撞检测
function checkBulletCollision(bullet, monster) {
    const dx = bullet.x - monster.x;
    const dy = bullet.y - monster.y;
    return Math.sqrt(dx * dx + dy * dy) < (bulletConfig.size + monster.size/2);
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    gameOverElement.classList.remove('hidden');
    finalScoreElement.textContent = score;
}

// 重启游戏
function restartGame() {
    init();
}

// 游戏循环
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// 事件监听
document.getElementById('restartButton').addEventListener('click', restartGame);

// 移除原有的点击和触摸事件监听器
canvas.removeEventListener('click', () => {});
canvas.removeEventListener('touchstart', () => {});

// 开始游戏
init();
gameLoop(); 