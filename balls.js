// Ball properties
class Ball {
    static getRandom(id) {
        const vx = (Math.random() - 0.5) * max_init_speed;
        const vy = (Math.random() - 0.5) * max_init_speed;
        const rad = Math.random() * (radius_min_max[1] - radius_min_max[0]) + radius_min_max[0];
        return new Ball(id, Math.random() * canvas.width, Math.random() * canvas.height, rad, vx, vy);
    }
    
    constructor(id, x, y, radius, vx, vy) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.mass = Math.PI * this.radius ** 2;
        this.color = '#3498db';
        this.velocity = { x: vx, y: vy };
        this.updateSpeed();
        
        // Constants for optimization
        this.margin = 5;
        this.computedCollisions = 0;
        this.seenCollisions = 0;
    }

    updateSpeed() {
        this.speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    }

    collideWall() {
        let hasCollided = false;
        
        // Check for collisions with walls - use early returns for clearer logic
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.velocity.x = -this.velocity.x * loss;
            hasCollided = true;
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.velocity.x = -this.velocity.x * loss;
            hasCollided = true;
        }
        
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            this.velocity.y = -this.velocity.y * loss;
            hasCollided = true;
        } else if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.velocity.y = -this.velocity.y * loss;
            hasCollided = true;
        }
        
        // Only update speed if there was a collision
        if (hasCollided) {
            this.updateSpeed();
        }
        
        return hasCollided;
    }

    update(dt, ballsDiscrete) {
        // Apply gravity
	this.velocity.y += gravity * dt;
        
        // Update position
        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;
        
        // Apply fans if enabled
        if (fans_speed > 0) {
            this.applyFans(fans_speed, dt);
        }
        
        // Handle collisions and update speed only if needed
        const ballCollisions = this.collideOthersDiscrete(ballsDiscrete);
        const wallCollision = this.collideWall();
	//const segCollisions = this.collideSegments();
        
        if (ballCollisions > 0 || wallCollision || fans_speed > 0) {
            this.updateSpeed();
        }
        
        return ballCollisions;
    }

    collideOthersDiscrete(ballsDiscrete) {
        if (!ballsDiscrete || ballsDiscrete.length === 0) {
            return 0;
        }
        
        this.computedCollisions = 0;
        
        // Calculate grid cell indices
        const discreteX = Math.floor(this.x / (2 * max_radius));
        const discreteY = Math.floor(this.y / (2 * max_radius));
        
        // Check neighboring cells efficiently with bounds checking
        const startX = Math.max(0, discreteX - 1);
        const startY = Math.max(0, discreteY - 1);
        const endX = Math.min(discreteX + 2, ballsDiscrete.length);
        const endY = Math.min(discreteY + 2, ballsDiscrete[0]?.length || 0);
        
        // Check for collisions with balls in nearby cells
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                if (ballsDiscrete[x] && ballsDiscrete[x][y]) {
                    for (const ball2 of ballsDiscrete[x][y]) {
                        if (ball2.id !== this.id) {
                            this.computedCollisions++;
                            this.collide(ball2);
                        }
                    }
                }
            }
        }
        
        return this.seenCollisions;
    }

    applyFans(accel, dt) {
        const mMargin = 10;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const force = 8 * accel * dt / this.mass;
        
        // Apply forces based on quadrant (NE, NW, SW, SE)
        if (this.x > (centerX + mMargin)) {
            if (this.y < (centerY - mMargin)) {
                // NE quadrant
                this.velocity.x -= force;
            } else if (this.y > (centerY + mMargin)) {
                // SE quadrant
                this.velocity.y -= force;
            }
        } else if (this.x < (centerX - mMargin)) {
            if (this.y < (centerY - mMargin)) {
                // NW quadrant
                this.velocity.y += force;
            } else if (this.y > (centerY + mMargin)) {
                // SW quadrant
                this.velocity.x += force;
            }
        }
    }

    collide(ball2, elasticity = loss) {
        // Calculate distance between centers - using squared distance for efficiency
        const dx = this.x - ball2.x;
        const dy = this.y - ball2.y;
        const distanceSquared = dx * dx + dy * dy;
        const minDistance = this.radius + ball2.radius;
        
        // Early out if no collision (using squared comparison to avoid square root)
        if (distanceSquared >= minDistance * minDistance) {
            return 0;
        }
        
        // Calculate actual distance for collision response
        const distance = Math.sqrt(distanceSquared);
        
        // Calculate collision normal
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Resolve overlap
        const overlap = minDistance - distance;
        const massTotal = this.mass + ball2.mass;
        const moveRatio1 = this.mass / massTotal;
        const moveRatio2 = ball2.mass / massTotal;
        
        // Move balls apart to prevent sticking
        const moveX = overlap * nx;
        const moveY = overlap * ny;
        
        ball2.x -= moveX * moveRatio1;
        ball2.y -= moveY * moveRatio1;
        this.x += moveX * moveRatio2;
        this.y += moveY * moveRatio2;
        
        // Calculate relative velocity along the normal
        const velRelativeX = this.velocity.x - ball2.velocity.x;
        const velRelativeY = this.velocity.y - ball2.velocity.y;
        
        // Calculate impulse scalar (simplified physics formula)
        const impulseScalar = -(1 + elasticity) * (velRelativeX * nx + velRelativeY * ny) / 
                             ((1 / this.mass) + (1 / ball2.mass));
        
        // Apply impulse to both balls
        const impulseX = impulseScalar * nx;
        const impulseY = impulseScalar * ny;
        
        this.velocity.x += impulseX / this.mass;
        this.velocity.y += impulseY / this.mass;
        ball2.velocity.x -= impulseX / ball2.mass;
        ball2.velocity.y -= impulseY / ball2.mass;
        
        // Update speeds after collision
        this.updateSpeed();
        ball2.updateSpeed();

	this.seenCollisions += 1;
	ball2.seenCollisions += 1;
	
        return 1; // Collision occurred
    }
    
    collideSegments() {
        for (const obstacle of obstacles) {
            const collisionPoint = this.checkSegmentCollision(obstacle);
            if (collisionPoint) {
                // Calculate collision normal
                const normalX = this.x - collisionPoint.x;
                const normalY = this.y - collisionPoint.y;
                const normalLength = Math.sqrt(normalX ** 2 + normalY ** 2);
                
                // Normalize the vector
                const nx = normalX / normalLength;
                const ny = normalY / normalLength;
                
                // Calculate reflection
                const dotProduct = 2 * (this.velocity.x * nx + this.velocity.y * ny);
                this.velocity.x -= dotProduct * nx;
                this.velocity.y -= dotProduct * ny;
                
                // Update speed after reflection
                this.updateSpeed();
                
                // Move ball out of obstacle to prevent sticking
                const penetration = this.radius - normalLength;
                if (penetration > 0) {
                    this.x += nx * penetration;
                    this.y += ny * penetration;
                }
            }
        }
    }
    
    checkSegmentCollision(lineSegment) {
        // Get line segment vector
        const segVecX = lineSegment.end.x - lineSegment.start.x;
        const segVecY = lineSegment.end.y - lineSegment.start.y;
        const segLengthSquared = segVecX ** 2 + segVecY ** 2;
        
        if (segLengthSquared === 0) return null; // Avoid division by zero for point segments
        
        // Vector from segment start to ball center
        const ballVecX = this.x - lineSegment.start.x;
        const ballVecY = this.y - lineSegment.start.y;
        
        // Project ball position onto line segment
        const dotProduct = (ballVecX * segVecX + ballVecY * segVecY) / segLengthSquared;
        
        // Find closest point on segment
        let closestX, closestY;
        
        if (dotProduct < 0) {
            // Closest to start point
            closestX = lineSegment.start.x;
            closestY = lineSegment.start.y;
        } else if (dotProduct > 1) {
            // Closest to end point
            closestX = lineSegment.end.x;
            closestY = lineSegment.end.y;
        } else {
            // Closest to point on segment
            closestX = lineSegment.start.x + dotProduct * segVecX;
            closestY = lineSegment.start.y + dotProduct * segVecY;
        }
        
        // Calculate distance to closest point (squared)
        const distanceSquared = (this.x - closestX) ** 2 + (this.y - closestY) ** 2;
        
        // Check collision using squared distance
        if (distanceSquared <= this.radius ** 2) {
            return { x: closestX, y: closestY };
        }
        
        return null; // No collision
    }
}
