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
        name: '直升机',
        color: '#FF4500',
        size: 35,
        speed: 0.4,
        points: 25,
        spawnChance: 0.3,
        maxHealth: 3,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 50;  // 螺旋桨快速旋转
            
            // 机身
            const bodyGradient = ctx.createLinearGradient(x - size, y, x + size, y);
            bodyGradient.addColorStop(0, '#FF4500');
            bodyGradient.addColorStop(0.5, '#FF6347');
            bodyGradient.addColorStop(1, '#FF4500');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // 驾驶舱
            ctx.fillStyle = 'rgba(135, 206, 250, 0.7)';
            ctx.beginPath();
            ctx.ellipse(x - size * 0.2, y - size * 0.1, size * 0.3, size * 0.2, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();

            // 尾部
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.moveTo(x + size * 0.3, y);
            ctx.lineTo(x + size * 0.8, y - size * 0.2);
            ctx.lineTo(x + size * 0.8, y + size * 0.2);
            ctx.closePath();
            ctx.fill();

            // 主螺旋桨
            ctx.strokeStyle = '#A0A0A0';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.translate(x, y - size * 0.4);
                ctx.rotate(time + (i * Math.PI / 2));
                ctx.beginPath();
                ctx.moveTo(-size * 0.8, 0);
                ctx.lineTo(size * 0.8, 0);
                ctx.stroke();
                ctx.restore();
            }

            // 尾部螺旋桨
            for (let i = 0; i < 2; i++) {
                ctx.save();
                ctx.translate(x + size * 0.8, y);
                ctx.rotate(time * 2 + (i * Math.PI));
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.2);
                ctx.lineTo(0, size * 0.2);
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        }
    },
    {
        name: '热气球',
        color: '#FF69B4',
        size: 40,
        speed: 0.2,
        points: 15,
        spawnChance: 0.2,
        maxHealth: 2,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 200;
            const floatY = Math.sin(time) * 3;  // 漂浮效果

            // 气球部分
            const balloonGradient = ctx.createRadialGradient(
                x, y + floatY, 0,
                x, y + floatY, size
            );
            balloonGradient.addColorStop(0, '#FF69B4');
            balloonGradient.addColorStop(0.7, '#FF1493');
            balloonGradient.addColorStop(1, '#C71585');

            ctx.fillStyle = balloonGradient;
            ctx.beginPath();
            ctx.moveTo(x, y + floatY - size);
            ctx.quadraticCurveTo(
                x + size, y + floatY - size * 0.5,
                x + size * 0.5, y + floatY
            );
            ctx.quadraticCurveTo(
                x + size * 0.5, y + floatY + size * 0.5,
                x, y + floatY + size * 0.7
            );
            ctx.quadraticCurveTo(
                x - size * 0.5, y + floatY + size * 0.5,
                x - size * 0.5, y + floatY
            );
            ctx.quadraticCurveTo(
                x - size, y + floatY - size * 0.5,
                x, y + floatY - size
            );
            ctx.fill();

            // 装饰条纹
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.ellipse(x, y + floatY, size * 0.8 * (i/3), size * 0.6 * (i/3), 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            // 篮子
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x - size * 0.3, y + floatY + size * 0.8, size * 0.6, size * 0.3);

            // 绳子
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - size * 0.4, y + floatY + size * 0.6);
            ctx.lineTo(x - size * 0.3, y + floatY + size * 0.8);
            ctx.moveTo(x + size * 0.4, y + floatY + size * 0.6);
            ctx.lineTo(x + size * 0.3, y + floatY + size * 0.8);
            ctx.stroke();

            ctx.restore();
        }
    },
    {
        name: '机器人',
        color: '#4169E1',
        size: 30,
        speed: 0.3,
        points: 20,
        spawnChance: 0.25,
        maxHealth: 4,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 150;
            const hover = Math.sin(time) * 2;

            // 机器人头部
            const headGradient = ctx.createLinearGradient(x - size/2, y, x + size/2, y);
            headGradient.addColorStop(0, '#4169E1');
            headGradient.addColorStop(0.5, '#1E90FF');
            headGradient.addColorStop(1, '#4169E1');
            
            ctx.fillStyle = headGradient;
            ctx.fillRect(x - size * 0.3, y - size * 0.3 + hover, size * 0.6, size * 0.4);

            // 眼睛
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(x - size * 0.1, y - size * 0.1 + hover, size * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + size * 0.1, y - size * 0.1 + hover, size * 0.08, 0, Math.PI * 2);
            ctx.fill();

            // 天线
            ctx.strokeStyle = '#4169E1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - size * 0.2, y - size * 0.3 + hover);
            ctx.lineTo(x - size * 0.3, y - size * 0.5 + hover);
            ctx.moveTo(x + size * 0.2, y - size * 0.3 + hover);
            ctx.lineTo(x + size * 0.3, y - size * 0.5 + hover);
            ctx.stroke();

            // 身体
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(x - size * 0.4, y + size * 0.1 + hover, size * 0.8, size * 0.5);

            // 机械臂
            const armAngle = Math.sin(time) * 0.2;
            ctx.save();
            ctx.translate(x - size * 0.4, y + size * 0.2 + hover);
            ctx.rotate(armAngle);
            ctx.fillRect(-size * 0.3, 0, size * 0.3, size * 0.1);
            ctx.restore();

            ctx.save();
            ctx.translate(x + size * 0.4, y + size * 0.2 + hover);
            ctx.rotate(-armAngle);
            ctx.fillRect(0, 0, size * 0.3, size * 0.1);
            ctx.restore();

            // 推进器
            const thrusterGlow = ctx.createRadialGradient(
                x, y + size * 0.6 + hover, 0,
                x, y + size * 0.6 + hover, size * 0.3
            );
            thrusterGlow.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
            thrusterGlow.addColorStop(0.5, 'rgba(0, 255, 255, 0.3)');
            thrusterGlow.addColorStop(1, 'rgba(0, 255, 255, 0)');

            ctx.fillStyle = thrusterGlow;
            ctx.beginPath();
            ctx.arc(x, y + size * 0.6 + hover, size * 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },
    {
        name: '邪恶UFO',
        color: '#9370DB',
        size: 45,
        speed: 0.35,
        points: 30,
        spawnChance: 0.15,
        maxHealth: 5,
        drawShape: (ctx, x, y, size) => {
            ctx.save();
            const time = Date.now() / 180;
            const hover = Math.sin(time) * 3;

            // UFO主体
            const ufoGradient = ctx.createLinearGradient(x, y - size/2, x, y + size/2);
            ufoGradient.addColorStop(0, '#9370DB');
            ufoGradient.addColorStop(0.5, '#8A2BE2');
            ufoGradient.addColorStop(1, '#9370DB');

            ctx.fillStyle = ufoGradient;
            ctx.beginPath();
            ctx.ellipse(x, y + hover, size * 0.8, size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();

            // 舱室
            const cockpitGradient = ctx.createRadialGradient(
                x, y + hover, 0,
                x, y + hover, size * 0.4
            );
            cockpitGradient.addColorStop(0, 'rgba(144, 238, 144, 0.6)');
            cockpitGradient.addColorStop(0.7, 'rgba(144, 238, 144, 0.3)');
            cockpitGradient.addColorStop(1, 'rgba(144, 238, 144, 0)');

            ctx.fillStyle = cockpitGradient;
            ctx.beginPath();
            ctx.arc(x, y + hover, size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // 光束效果
            const beamGradient = ctx.createLinearGradient(x, y + hover, x, y + hover + size);
            beamGradient.addColorStop(0, 'rgba(144, 238, 144, 0.4)');
            beamGradient.addColorStop(1, 'rgba(144, 238, 144, 0)');

            ctx.fillStyle = beamGradient;
            ctx.beginPath();
            ctx.moveTo(x - size * 0.3, y + hover);
            ctx.lineTo(x + size * 0.3, y + hover);
            ctx.lineTo(x + size * 0.15, y + hover + size);
            ctx.lineTo(x - size * 0.15, y + hover + size);
            ctx.closePath();
            ctx.fill();

            // 闪烁的灯
            const lights = 6;
            for (let i = 0; i < lights; i++) {
                const angle = (i / lights) * Math.PI * 2 + time;
                const lightX = x + Math.cos(angle) * size * 0.7;
                const lightY = y + hover + Math.sin(angle) * size * 0.25;
                
                ctx.fillStyle = `hsl(${(time * 50 + i * 50) % 360}, 100%, 50%)`;
                ctx.beginPath();
                ctx.arc(lightX, lightY, size * 0.06, 0, Math.PI * 2);
                ctx.fill();
            }

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

// 添加云朵数组
let clouds = [];

// 添加建筑物数组
let buildings = [];

// 添加触摸控制变量
let touchStartY = 0;
let touchStartX = 0;
let isTouching = false;
let touchThreshold = 20;

// 添加触摸事件监听
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
    isTouching = true;
    controls.shoot = true;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isTouching) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;
    
    if (Math.abs(deltaY) > touchThreshold) {
        if (deltaY < 0) {
            controls.up = true;
            controls.down = false;
        } else {
            controls.up = false;
            controls.down = true;
        }
        touchStartY = touch.clientY; // 更新起始位置，使移动更流畅
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isTouching = false;
    controls.up = false;
    controls.down = false;
    controls.shoot = false;
}, { passive: false });

// 添加屏幕自适应
function resizeCanvas() {
    const container = document.querySelector('.container');
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    if (windowWidth <= 768) { // 移动设备
        canvas.width = windowWidth;
        canvas.height = windowHeight;
    } else { // PC设备
        canvas.width = 320;
        canvas.height = 480;
    }
    
    // 重新初始化小鸟位置
    bird.x = canvas.width * 0.2;
    bird.y = canvas.height / 2;
}

// 添加窗口大小变化监听
window.addEventListener('resize', resizeCanvas);

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

// 修改初始化函数
function init() {
    resizeCanvas();
    bird.y = canvas.height / 2;
    bird.x = canvas.width * 0.2;
    bird.velocity = 0;
    bird.shootCooldown = 0;
    monsters = [];
    bullets = [];
    score = 0;
    gameRunning = true;
    gameOverElement.classList.add('hidden');
    updateScore();
    
    // 初始化云朵
    clouds = Array.from({length: 5}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height / 2),
        size: 30 + Math.random() * 40,
        speed: 0.2 + Math.random() * 0.3
    }));
    
    // 初始化建筑物
    const buildingCount = 6;
    const buildingWidth = canvas.width / buildingCount;
    buildings = Array.from({length: buildingCount}, (_, i) => ({
        x: i * buildingWidth,
        width: buildingWidth * 0.8,
        height: 100 + Math.random() * 200,
        windows: Math.floor(3 + Math.random() * 4),
        floors: Math.floor(4 + Math.random() * 4)
    }));
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

// 更新云朵位置
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + cloud.size < 0) {
            cloud.x = canvas.width + cloud.size;
            cloud.y = Math.random() * (canvas.height / 2);
        }
    });
}

// 绘制云朵
function drawCloud(x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x + size * 0.7, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
}

// 绘制建筑物
function drawBuilding(building) {
    // 建筑物主体
    const gradient = ctx.createLinearGradient(building.x, 0, building.x + building.width, 0);
    gradient.addColorStop(0, '#4A4A4A');
    gradient.addColorStop(0.5, '#5A5A5A');
    gradient.addColorStop(1, '#4A4A4A');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(building.x, canvas.height - building.height, building.width, building.height);
    
    // 窗户
    const windowWidth = building.width / (building.windows + 1);
    const windowHeight = building.height / (building.floors + 1);
    const windowSize = Math.min(windowWidth, windowHeight) * 0.7;
    
    for (let floor = 1; floor <= building.floors; floor++) {
        for (let w = 1; w <= building.windows; w++) {
            const windowX = building.x + w * (building.width / (building.windows + 1)) - windowSize/2;
            const windowY = canvas.height - building.height + floor * (building.height / (building.floors + 1)) - windowSize/2;
            
            // 随机决定窗户是否亮着
            if (Math.random() < 0.7) {
                ctx.fillStyle = 'rgba(255, 255, 150, 0.8)';
            } else {
                ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
            }
            
            ctx.fillRect(windowX, windowY, windowSize, windowSize);
        }
    }
}

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

    // 更新云朵位置
    updateClouds();
}

// 绘制游戏画面
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制渐变天空
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#1E90FF');    // 深蓝色
    skyGradient.addColorStop(0.5, '#87CEEB');  // 天蓝色
    skyGradient.addColorStop(1, '#B0E0E6');    // 粉蓝色
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制云朵
    clouds.forEach(cloud => {
        drawCloud(cloud.x, cloud.y, cloud.size);
    });

    // 绘制建筑物
    buildings.forEach(building => {
        drawBuilding(building);
    });

    // 绘制小鸟
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // 身体
    const bodyGradient = ctx.createLinearGradient(-bird.size/2, 0, bird.size/2, 0);
    bodyGradient.addColorStop(0, '#FFB6C1');  // 粉色
    bodyGradient.addColorStop(0.5, '#FFC0CB');
    bodyGradient.addColorStop(1, '#FFB6C1');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.size * 0.8, bird.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 翅膀
    const wingAngle = Math.sin(Date.now() / 100) * 0.5; // 翅膀扇动动画
    const wingGradient = ctx.createLinearGradient(0, -bird.size, 0, bird.size);
    wingGradient.addColorStop(0, '#FFA07A');  // 浅鲑鱼色
    wingGradient.addColorStop(1, '#FF8C69');  // 深鲑鱼色

    // 左翼
    ctx.save();
    ctx.translate(-bird.size * 0.3, 0);
    ctx.rotate(wingAngle);
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.size * 0.5, bird.size * 0.3, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 右翼
    ctx.save();
    ctx.translate(bird.size * 0.3, 0);
    ctx.rotate(-wingAngle);
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.size * 0.5, bird.size * 0.3, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 头部
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.arc(bird.size * 0.6, -bird.size * 0.1, bird.size * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.size * 0.7, -bird.size * 0.2, bird.size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // 眼球
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.size * 0.75, -bird.size * 0.2, bird.size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // 高光
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.size * 0.77, -bird.size * 0.22, bird.size * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // 嘴巴
    ctx.fillStyle = '#FFA500';  // 橙色
    ctx.beginPath();
    ctx.moveTo(bird.size * 0.9, -bird.size * 0.1);
    ctx.lineTo(bird.size * 1.1, -bird.size * 0.05);
    ctx.lineTo(bird.size * 0.9, 0);
    ctx.closePath();
    ctx.fill();

    // 尾巴
    const tailFeathers = 3;
    const tailAngle = Math.PI / 6;
    ctx.fillStyle = '#FFA07A';
    for (let i = 0; i < tailFeathers; i++) {
        ctx.save();
        ctx.translate(-bird.size * 0.7, 0);
        ctx.rotate((i - 1) * tailAngle / 2);
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.size * 0.4, bird.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 腿部
    ctx.strokeStyle = '#FFA07A';
    ctx.lineWidth = 3;
    // 左腿
    ctx.beginPath();
    ctx.moveTo(-bird.size * 0.2, bird.size * 0.4);
    ctx.lineTo(-bird.size * 0.3, bird.size * 0.6);
    ctx.stroke();
    // 右腿
    ctx.beginPath();
    ctx.moveTo(bird.size * 0.1, bird.size * 0.4);
    ctx.lineTo(0, bird.size * 0.6);
    ctx.stroke();

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