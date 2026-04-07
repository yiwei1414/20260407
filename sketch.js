let gameState = "START"; 
let points = [];
let lowerPoints = [];
let numPoints = 8; 
let clouds = []; 
let carW = 35; 
let houseSize = 50; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  generateEnvironment();
  generatePath();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateEnvironment();
  generatePath();
}

function draw() {
  drawScenicBackground(); 

  if (gameState === "START") {
    drawRoad(true); 
    showScreen("極速公路：平滑彎道版", "點擊左側 START 開始挑戰");
    drawButton(80, height / 2 - 40, 120, 80, color(0, 180, 0));
    cursor(ARROW);
  } 
  else if (gameState === "READY" || gameState === "PLAYING") {
    drawRoad(false);
    drawFinishHouse(); 
    
    if (gameState === "READY") {
      let startX = 50; 
      let startY = height / 2;
      drawCar(startX, startY);
      showScreen("", "準備好出發了嗎？點擊開始！");
      cursor(CROSS);
    } else {
      noCursor();
      checkCollision();
      drawCar(mouseX, mouseY);
      if (mouseX > width - 70) gameState = "WIN";
    }
  } 
  else if (gameState === "FAIL") {
    cursor(ARROW);
    showScreen("🚧 發生事故了！", "點擊畫面重回起點");
  } 
  else if (gameState === "WIN") {
    cursor(ARROW);
    showScreen("🏡 我順利回家了！", "點擊畫面重新挑戰");
  }
}

function generateEnvironment() {
  clouds = [];
  for (let i = 0; i < 6; i++) {
    clouds.push(new Cloud());
  }
}

function drawScenicBackground() {
  noStroke();
  fill(135, 206, 235); // 天藍色
  rect(0, 0, width, height / 2);
  for (let cloud of clouds) {
    cloud.update();
    cloud.display();
  }
  fill(34, 139, 34); // 草綠色
  rect(0, height / 2, width, height / 2);
}

class Cloud {
  constructor() {
    this.x = random(width);
    this.y = random(height * 0.1, height * 0.4);
    this.speed = random(0.2, 0.5);
    this.size = random(40, 80);
  }
  update() {
    this.x += this.speed;
    if (this.x > width + this.size) this.x = -this.size;
  }
  display() {
    fill(255, 255, 255, 200);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size * 0.8);
    ellipse(this.x + this.size * 0.4, this.y + this.size * 0.1, this.size * 0.7, this.size * 0.6);
    ellipse(this.x - this.size * 0.3, this.y + this.size * 0.1, this.size * 0.6, this.size * 0.5);
  }
}

function generatePath() {
  points = [];
  lowerPoints = [];
  let spacing = width / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    let x = i * spacing;
    let yBase = (i === 0 || i === numPoints - 1) ? height / 2 : random(height * 0.2, height * 0.8);
    // 恢復原始寬度 60-110
    let gap = random(60, 110); 
    
    points.push(createVector(x, yBase - gap / 2));
    lowerPoints.push(createVector(x, yBase + gap / 2));
  }
}

function drawRoad(isDemo = false) {
  fill(60); 
  if (isDemo) fill(60, 150);
  noStroke();
  
  // 繪製平滑曲線馬路
  beginShape();
  curveVertex(points[0].x, points[0].y); 
  for (let p of points) curveVertex(p.x, p.y);
  curveVertex(points[numPoints-1].x, points[numPoints-1].y); 
  
  curveVertex(lowerPoints[numPoints-1].x, lowerPoints[numPoints-1].y); 
  for (let i = numPoints - 1; i >= 0; i--) {
    curveVertex(lowerPoints[i].x, lowerPoints[i].y);
  }
  curveVertex(lowerPoints[0].x, lowerPoints[0].y); 
  endShape(CLOSE);

  if (!isDemo) {
    // 路肩白線
    stroke(255);
    strokeWeight(3);
    noFill();
    
    beginShape();
    curveVertex(points[0].x, points[0].y);
    for (let p of points) curveVertex(p.x, p.y);
    curveVertex(points[numPoints-1].x, points[numPoints-1].y);
    endShape();
    
    beginShape();
    curveVertex(lowerPoints[0].x, lowerPoints[0].y);
    for (let p of lowerPoints) curveVertex(p.x, p.y);
    curveVertex(lowerPoints[numPoints-1].x, lowerPoints[numPoints-1].y);
    endShape();

    // 中央黃色虛線
    stroke(255, 220, 0);
    strokeWeight(2);
    if (drawingContext.setLineDash) drawingContext.setLineDash([15, 15]);
    beginShape();
    curveVertex(points[0].x, (points[0].y + lowerPoints[0].y)/2);
    for (let i = 0; i < numPoints; i++) {
      curveVertex(points[i].x, (points[i].y + lowerPoints[i].y) / 2);
    }
    curveVertex(points[numPoints-1].x, (points[numPoints-1].y + lowerPoints[numPoints-1].y)/2);
    endShape();
    if (drawingContext.setLineDash) drawingContext.setLineDash([]); 
  }
}

function checkCollision() {
  let segmentWidth = width / (numPoints - 1);
  let idx = floor(mouseX / segmentWidth);
  
  if (idx >= 0 && idx < numPoints - 1) {
    let t = (mouseX % segmentWidth) / segmentWidth;
    
    // 使用 curvePoint 進行精確曲線座標計算
    let i0 = max(idx - 1, 0);
    let i1 = idx;
    let i2 = min(idx + 1, numPoints - 1);
    let i3 = min(idx + 2, numPoints - 1);

    let upperY = curvePoint(points[i0].y, points[i1].y, points[i2].y, points[i3].y, t);
    let lowerY = curvePoint(lowerPoints[i0].y, lowerPoints[i1].y, lowerPoints[i2].y, lowerPoints[i3].y, t);

    // 恢復較寬通道後的判定寬鬆度 (給予 3 像素緩衝)
    let buffer = 3;
    if (mouseY <= upperY + buffer || mouseY >= lowerY - buffer) {
      gameState = "FAIL";
    }
  }
}

function drawFinishHouse() {
  let finishX = width - 40; 
  let finishY = (points[numPoints-1].y + lowerPoints[numPoints-1].y) / 2; 
  push();
  translate(finishX, finishY);
  rectMode(CENTER);
  fill(255, 215, 0); 
  stroke(0);
  strokeWeight(2);
  rect(0, 0, houseSize, houseSize, 3);
  fill(220, 20, 20); 
  triangle(-houseSize/2 - 5, -houseSize/2, houseSize/2 + 5, -houseSize/2, 0, -houseSize/2 - 25);
  fill(139, 69, 19);
  rect(0, houseSize/4, houseSize/3, houseSize/2);
  pop();
}

function drawCar(x, y) {
  push();
  translate(x, y);
  rectMode(CENTER);
  stroke(0);
  strokeWeight(1.5);
  fill(220, 20, 20);
  rect(0, 0, carW, 20, 4);
  fill(100, 200, 255);
  rect(8, 0, 8, 14); 
  fill(30);
  rect(-10, -10, 8, 4); 
  rect(10, -10, 8, 4);  
  rect(-10, 10, 8, 4);   
  rect(10, 10, 8, 4);    
  pop();
}

function drawButton(x, y, w, h, col) {
  fill(col);
  stroke(255);
  strokeWeight(2);
  rect(x, y, w, h, 10);
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(22);
  text("START", x + w/2, y + h/2);
}

function showScreen(title, sub) {
  textAlign(CENTER, CENTER);
  fill(255);
  stroke(0, 150); 
  strokeWeight(2);
  textSize(min(width * 0.05, 48));
  text(title, width/2, height/2 - 40);
  noStroke();
  fill(255);
  textSize(min(width * 0.02, 20));
  text(sub, width/2, height/2 + 40);
}

function mousePressed() {
  if (gameState === "START") {
    if (mouseX > 80 && mouseX < 200 && mouseY > height/2 - 40 && mouseY < height/2 + 40) {
      gameState = "READY";
    }
  } else if (gameState === "READY") {
    gameState = "PLAYING";
  } else if (gameState === "FAIL" || gameState === "WIN") {
    generatePath();
    gameState = "START";
  }
}
