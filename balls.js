
// Ball properties
class ball {
    static get_random(id) {
	vx = (Math.random()-0.5) * max_init_speed;
	vy = (Math.random()-0.5) * max_init_speed;
	rad = Math.random() * (radius_min_max[1]-radius_min_max[0]) + radius_min_max[0];
	return new ball(id, Math.random() * canvas.width, Math.random() * canvas.height, rad,  vx, vy);
    }
    
    constructor(id, x, y, radius, vx, vy) {
	this.computed_collisions = 0;
	this.margin = 5;
	this.id = id;
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.mass = Math.PI * this.radius ** 2;
	this.color = '#3498db';
	this.velocity = {
	    x: vx,
	    y: vy
	};
	this.speed = Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
    };

    collide_wall() {
        // Check for collisions with walls
        if (this.x - this.radius < 0) {
	    this.x = this.radius;
	    this.velocity.x = -this.velocity.x * loss;
        }
	if ( this.x + this.radius > canvas.width) {
	    this.x = canvas.width - this.radius;
	    this.velocity.x = -this.velocity.x * loss;
	}
	if (this.y - this.radius < 0) {
	    this.velocity.y = -this.velocity.y * loss;
	    this.y = /*-this.y */ this.radius;
	}
        if ( this.y + this.radius > canvas.height) {
	    this.velocity.y = -this.velocity.y * loss;
	    this.y = canvas.height - this.radius; 
        }
    }

    update(dt, balls_discrete) {
        // Update ball position based on velocity
	this.velocity.y += gravity * dt;
        this.x += this.velocity.x  * dt;
        this.y += this.velocity.y  * dt;
	//this.collide_segments();
	if (fans_speed > 0)
	    this.apply_fans(fans_speed, dt);
	this.speed = Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
	let colls = this.collide_others_discrete(balls_discrete);
	this.collide_wall();
	return colls;
    }

    collide_others_discrete(balls_discrete) {
	if (balls_discrete.length == 0)
	    return;
	this.computed_collisions = 0;
	this.seen_collisions = 0;
	let discrete_x = Math.floor(this.x / (2*max_radius));
	let discrete_y = Math.floor(this.y / (2*max_radius));
	let end_x = Math.min(discrete_x+2, balls_discrete.length);
	let end_y = Math.min(discrete_y+2, balls_discrete[0].length);
	
	for (let start_x = Math.max(0,discrete_x-1); start_x < end_x; start_x++) {
	    for (let start_y = Math.max(0,discrete_y-1); start_y < end_y ; start_y++) {
		balls_discrete[start_x][start_y].forEach(ball2 => {
		    if (ball2.id  != this.id) {
			this.computed_collisions ++;
			this.seen_collisions += this.collide(ball2);
		    }
		});
	    }
	}
	return this.seen_collisions;
    }

    apply_fans(accell, dt) {
	let m_margin = 10;
	// NE
	if (this.x > (canvas.width/2 +m_margin) && this.y < (canvas.height/2 - m_margin)) {
	    this.velocity.x -= 8*accell*dt / this.mass;
	}
	// NW
	if (this.x < (canvas.width/2 -m_margin) && this.y < (canvas.height/2 -m_margin)) {
	    this.velocity.y += 8*accell*dt / this.mass;
	}
	// SW
	if (this.x < (canvas.width/2 -m_margin) && this.y > (canvas.height/2 + m_margin )) {
	    this.velocity.x += 8*accell*dt / this.mass;
	}
	// SE
	if (this.x > (canvas.width/2+ m_margin) && this.y > (canvas.height/2 + m_margin)) {
	    this.velocity.y -= 8*accell*dt / this.mass;
	}

    }

    collide(ball2, elasticity = loss) {
	// Calculate the distance between the centers of the two balls
	const dx = this.x - ball2.x;
	const dy = this.y - ball2.y;
	const distance = Math.sqrt(dx**2 + dy**2);

	// Check if the distance is less than the sum of their radii
	if (distance < this.radius + ball2.radius) {
            // Collision has occurred

            // Calculate the direction of the collision
            const collisionAngle = Math.atan2(dy, dx);

            // Move the balls away from each other proportional to their radii
            const overlap = (this.radius + ball2.radius) - distance;
            const moveRatio1 = this.radius / (this.radius + ball2.radius);
            const moveRatio2 = ball2.radius / (this.radius + ball2.radius);

            this.x += overlap * moveRatio1 * Math.cos(collisionAngle);
            this.y += overlap * moveRatio1 * Math.sin(collisionAngle);

            ball2.x -= overlap * moveRatio2 * Math.cos(collisionAngle);
            ball2.y -= overlap * moveRatio2 * Math.sin(collisionAngle);

            // Calculate masses and final velocities
            const totalMass = this.mass + ball2.mass; // this.radius + ball2.radius;
            const phi = collisionAngle; // Contact angle

            const v1 = this.speed; //Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
            const v1Angle = Math.atan2(this.velocity.y, this.velocity.x);

            const v2 = ball2.speed; //Math.sqrt(ball2.velocity.x**2 + ball2.velocity.y**2);
            const v2Angle = Math.atan2(ball2.velocity.y, ball2.velocity.x);

	    const pi = Math.PI;
	    const v1_phi_cos = Math.cos(v1Angle - phi);
	    const v2_phi_cos = Math.cos(v2Angle - phi);
	    const v1_phi_sin = Math.sin(v1Angle - phi);
	    const v2_phi_sin = Math.sin(v2Angle - phi);
	    
	    const cos_phi_pi2 = Math.cos(phi + pi/2);
	    const sin_phi_pi2 = Math.sin(phi + pi/2);

	    const cos_phi = Math.cos(phi);
	    const sin_phi = Math.sin(phi);
	    
	    
	 // Calculate new velocities
	    const v1xFinal = ((v1 * v1_phi_cos * (this.mass - ball2.mass) +
			       2 * ball2.mass * v2 * v2_phi_cos ) / totalMass)
                  * cos_phi + v1 * v1_phi_sin * cos_phi_pi2;
	    
	    const v1yFinal = ((v1 * v1_phi_cos * (this.mass - ball2.mass) +
			       2 * ball2.mass * v2 * v2_phi_cos) / totalMass)
                  * sin_phi + v1 * v1_phi_sin * sin_phi_pi2;
	    
	    const v2xFinal = ((v2 * v2_phi_cos * (ball2.mass - this.mass) +
			       2 * this.mass * v1 * v1_phi_cos ) / totalMass)
                  * cos_phi + v2 * v2_phi_sin * cos_phi_pi2;
	    
	    const v2yFinal = ((v2 * v2_phi_cos * (ball2.mass - this.mass) +
			       2 * this.mass * v1 * v1_phi_cos ) / totalMass)
		  * sin_phi + v2 * v2_phi_sin * sin_phi_pi2;

            // Update velocities with elasticity
            this.velocity.x = v1xFinal * elasticity;
            this.velocity.y = v1yFinal * elasticity;

            ball2.velocity.x = v2xFinal * elasticity;
            ball2.velocity.y = v2yFinal * elasticity;

            return 1; // Collision occurred
	}

	return 0; // No collision
    }
    
    collide_segments() {
	obstacles.forEach(obstacle => {
	    const collisionPoint = this.isCollision(obstacle);
	    if (collisionPoint) {
		// Resolve collision
		const normalX = this.x - collisionPoint.x;
		const normalY = this.y - collisionPoint.y;
		const length = Math.sqrt(normalX ** 2 + normalY ** 2);
		const normal = { x: normalX / length, y: normalY / length };
		
		// Reflect the velocity vector based on the collision normal
		const dotProduct = this.velocity.x * normal.x + this.velocity.y * normal.y;
		this.velocity.x -= 2 * dotProduct * normal.x;
		this.velocity.y -= 2 * dotProduct * normal.y;
	    }
	});
    }
    
    isCollision(lineSegment) {
	const dx = lineSegment.end.x - lineSegment.start.x;
	const dy = lineSegment.end.y - lineSegment.start.y;
	const lengthSquared = dx * dx + dy * dy;

	const fromStartToBall = {
	    x: this.x - lineSegment.start.x,
	    y: this.y - lineSegment.start.y
	};

	const dotProduct = (fromStartToBall.x * dx + fromStartToBall.y * dy) / lengthSquared;
	const closestX = lineSegment.start.x + dotProduct * dx;
	const closestY = lineSegment.start.y + dotProduct * dy;

	const onSegment = dotProduct >= 0 && dotProduct <= 2;
	const distanceSquared = (this.x - closestX) ** 2 + (this.y - closestY) ** 2;
	const collision = onSegment && distanceSquared <= this.radius ** 2;

	return collision ? { x: closestX, y: closestY } : null;
    }
};
