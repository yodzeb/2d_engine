
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
	this.color = '#3498db';
	this.velocity = {
	    x: vx,
	    y: vy
	};
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

    update(dt, balls_x_sorted, balls_x_sorted_indexes) {
        // Update ball position based on velocity
	this.velocity.y += gravity * dt;
        this.x += this.velocity.x  * dt;
        this.y += this.velocity.y  * dt;
	//this.collide_segments();
	if (fans_speed > 0)
	    this.apply_fans(fans_speed);
	this.speed = Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
	let colls = this.collide_others(balls_x_sorted, balls_x_sorted_indexes);
	this.collide_wall();
	return colls;
    }

    collide_others(balls_x_sorted, balls_x_sorted_indexes) {
	let zz=(balls_x_sorted_indexes[this.id])+1;
	this.computed_collisions = 0
	this.seen_collisions = 0;

	while (zz < nb_balls &&
	       (balls_x_sorted[zz].x - this.x) < (this.radius + max_radius + this.margin)) {
	    this.seen_collisions += this.collide(balls_x_sorted[zz]);
	    this.computed_collisions ++;
	    zz++;
	}
	zz=balls_x_sorted_indexes[this.id]-1;
	while (zz>=0 && (this.x - balls_x_sorted[zz].x) < (this.radius + max_radius + this.margin)) {
	    this.seen_collisions += this.collide(balls_x_sorted[zz]);
	    this.computed_collisions ++;
	    zz--;
	}
	return this.seen_collisions;
    }

    apply_fans(accell) {
	let m_margin = 10;
	// NE
	if (this.x > (canvas.width/2 +m_margin) && this.y < (canvas.height/2 - m_margin)) {
	    this.velocity.x -= accell*dt;
	}
	// NW
	if (this.x < (canvas.width/2 -m_margin) && this.y < (canvas.height/2 -m_margin)) {
	    this.velocity.y += accell*dt;
	}
	// SW
	if (this.x < (canvas.width/2 -m_margin) && this.y > (canvas.height/2 + m_margin )) {
	    this.velocity.x += accell*dt;
	}
	// SE
	if (this.x > (canvas.width/2+ m_margin) && this.y > (canvas.height/2 + m_margin)) {
	    this.velocity.y -= accell*dt;
	}

    }

    mass() {
	return Math.PI * (this.radius ** 2)
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
            const totalMass = this.mass() + ball2.mass(); // this.radius + ball2.radius;
            const phi = collisionAngle; // Contact angle

            const v1 = Math.sqrt(this.velocity.x**2 + this.velocity.y**2);
            const v1Angle = Math.atan2(this.velocity.y, this.velocity.x);

            const v2 = Math.sqrt(ball2.velocity.x**2 + ball2.velocity.y**2);
            const v2Angle = Math.atan2(ball2.velocity.y, ball2.velocity.x);

	    const pi = Math.PI;

	    
	 // Calculate new velocities
	    const v1xFinal = ((v1 * Math.cos(v1Angle - phi) * (this.mass() - ball2.mass()) +
			       2 * ball2.mass() * v2 * Math.cos(v2Angle - phi)) / totalMass)
                  * Math.cos(phi) + v1 * Math.sin(v1Angle - phi) * Math.cos(phi + pi/2);
	    
	    const v1yFinal = ((v1 * Math.cos(v1Angle - phi) * (this.mass() - ball2.mass()) +
			       2 * ball2.mass() * v2 * Math.cos(v2Angle - phi)) / totalMass)
                  * Math.sin(phi) + v1 * Math.sin(v1Angle - phi) * Math.sin(phi + pi/2);
	    
	    const v2xFinal = ((v2 * Math.cos(v2Angle - phi) * (ball2.mass() - this.mass()) +
			       2 * this.mass() * v1 * Math.cos(v1Angle - phi)) / totalMass)
                  * Math.cos(phi) + v2 * Math.sin(v2Angle - phi) * Math.cos(phi + pi/2);
	    
	    const v2yFinal = ((v2 * Math.cos(v2Angle - phi) * (ball2.mass() - this.mass()) +
			       2 * this.mass() * v1 * Math.cos(v1Angle - phi)) / totalMass)
		  * Math.sin(phi) + v2 * Math.sin(v2Angle - phi) * Math.sin(phi + pi/2);

	 // // Calculate new velocities
	 //    const v1xFinal = ((v1 * Math.cos(v1Angle - phi) * (this.radius - ball2.radius) +
	 // 		       2 * ball2.radius * v2 * Math.cos(v2Angle - phi)) / totalMass)
         //          * Math.cos(phi) + v1 * Math.sin(v1Angle - phi) * Math.cos(phi + pi/2);
	    
	 //    const v1yFinal = ((v1 * Math.cos(v1Angle - phi) * (this.radius - ball2.radius) +
	 // 		       2 * ball2.radius * v2 * Math.cos(v2Angle - phi)) / totalMass)
         //          * Math.sin(phi) + v1 * Math.sin(v1Angle - phi) * Math.sin(phi + pi/2);
	    
	 //    const v2xFinal = ((v2 * Math.cos(v2Angle - phi) * (ball2.radius - this.radius) +
	 // 		       2 * this.radius * v1 * Math.cos(v1Angle - phi)) / totalMass)
         //          * Math.cos(phi) + v2 * Math.sin(v2Angle - phi) * Math.cos(phi + pi/2);
	    
	 //    const v2yFinal = ((v2 * Math.cos(v2Angle - phi) * (ball2.radius - this.radius) +
	 // 		       2 * this.radius * v1 * Math.cos(v1Angle - phi)) / totalMass)
	 // 	  * Math.sin(phi) + v2 * Math.sin(v2Angle - phi) * Math.sin(phi + pi/2);

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
