const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight - 50;

const predatorCount = 500;
const preyCount = 800;
const grassCount = 45000;
const preyReprodctionRate = 1;

let time = 0;
let predators = [];
let preys = [];
let grass = [];

// const maxChartDataPoints = 500;
// const chartContainer = document.getElementById('population-chart');
// const speedContainer = document.getElementById('speed-chart');
//const ctx2 = chartContainer.getContext('2d');

const chartData = {
    labels: [],
    datasets: [
        {
            label: 'Predators',
            borderColor: 'red',
            data: [],
        },
        {
            label: 'Preys',
            borderColor: 'orange',
            data: [],
        },
        {
            label: 'Grass',
            borderColor: 'green',
            data: [],
            yAxisID: 'y2',
        },
        {
            label: "Prey speed",
            borderColor: "lightgreen",
            data: [],
            yAxisID: 'y1',
        },
        {
            label: "Pred max age",
            borderColor: "purple",
            data: [],
            yAxisID: 'y3',
        }
    ],
};
/*
const populationChart = new Chart(ctx2, {
    type: 'line',
    data: chartData,
    options: {
        scales: {
            x: [{
                type: 'time',
                position: 'bottom',
            }],
            y: [{
                type: 'linear',
                position: 'left',
                
                ticks: {
                    //beginAtZero: true,
                    //maxRotation: 600
                },
            }],
            y1: [{
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },

            }],
            y2: [{
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
                
            }],
            y3: [{
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false, // only want the grid lines for one axis to show up
                },
                
            }]
        },
    },
});
*/

function updateChart(speed, max_age) {

    if (chartData.labels.length >= maxChartDataPoints) {
        chartData.labels.shift();
        chartData.datasets.forEach(dataset => dataset.data.shift());
    }
    chartData.labels.push(time);
    chartData.datasets[0].data.push(predators.length);
    chartData.datasets[1].data.push(preys.length);
    chartData.datasets[2].data.push(grass.length);
    chartData.datasets[3].data.push(speed);
    chartData.datasets[4].data.push(max_age);
    
    populationChart.update();
}



class Predator {
    constructor(parent) {
        let offset = 60;
        if (!parent) {
	    this.x = Math.random() * width;
	    this.y = Math.random() * height;
            this.speed = Math.random()*2 + 0.1;
            this.max_health = 30;
            this.max_age = 200;
        }
        else {
            this.x = (Math.abs(parent.x + width +  (Math.random()-0.5)*offset)) % width;
            this.y = (Math.abs(parent.y + height + (Math.random()-0.5)*offset)) % height;
            this.speed = Math.max((Math.random()/5-0.10)+parent.speed, 0.01);
            this.max_health = Math.max((Math.random()-0.5)+parent.max_health, 1);
            this.max_age = parent.max_age + (Math.random()-0.5);
        }        
        this.size = this.max_health/2.6;
        this.vision = 50;
        this.vx = (Math.random()-0.5) * this.speed;
	this.vy = (Math.random()-0.5) * this.speed;
        this.health = this.max_health / 2;
        this.age = 0;
        this.healthDecrease = this.speed / 80 + this.max_health / 500 ;
	this.color = 'red';

    }
    update() {
	this.x = (this.x + this.vx + width) % width;
	this.y = (this.y + this.vy + height) % height;
        this.age += 1;
        this.health -= this.healthDecrease;
        
        if (this.health <= 0 ||  this.age > this.max_age) {
            predators.splice(predators.indexOf(this), 1);
        }
    }

    draw() {
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
	ctx.fillStyle = this.color;
	ctx.fill();
        ctx.fillStyle = "black";
        ctx.fillText(Math.floor(this.health)+'/'+Math.floor(this.max_health), Math.max(this.x-12,0), this.y);
        ctx.fillText(Math.floor(this.max_age), Math.max(this.x-8,0), this.y+9);
    }
}

class Prey {
    constructor(parent) {
        let offset = 10;
        if (!parent) {
	    this.x = Math.random() * width;
	    this.y = Math.random() * height;
            this.speed = Math.random()*5;
            this.eatingDistance = Math.random() * 7;
            this.max_health = 10;
            this.color = (Math.random() < 0.5)?'orange':'purple';
        }
        else {
            this.x = (Math.abs(parent.x+(Math.random()-0.5)*offset)) % width;
            this.y = (Math.abs(parent.y+(Math.random()-0.5)*offset)) % height;
            this.speed = (Math.random()/5-0.1)+parent.speed
            this.eatingDistance = (Math.random()/5-0.1)+parent.eatingDistance;
            this.max_health = Math.max((Math.random()/10-0.05)+parent.max_health, 1);
            this.color = parent.color;
        }
	this.size = Math.max(8-this.speed, 0.1);
        this.age = 0;
        this.max_age = 70;
	this.vx = (Math.random()-0.5) * this.speed ;
	this.vy = (Math.random()-0.5) * this.speed ;

	this.framesUntilNewVelocity = 60; // Change this value to control how often the prey's velocity changes
        this.health = this.max_health / 2;
        this.healthDecrease = (this.speed**2.8) / 30 + (this.eatingDistance**2) / 60 + (this.max_health**2)/500;
    }
    
    update(sorted_preys, limit) {
        this.health -= this.healthDecrease;
        this.age += 1;
        if (this.health < 0 || this.age > this.max_age) {
            preys.splice(preys.indexOf(this), 1);
            return;
        }

        let closest = 200;
        let found_grass = null;
        this.x = (this.x + this.vx + width) % width;
        this.y = (this.y + this.vy + height) % height;
        let dist = 0
        if (this.health < this.max_health) {
            let x_min = Math.max(0,Math.floor(this.x / limit)-2);
            let x_max = Math.floor(this.x / limit)+2;
            let y_min = Math.max(0,Math.floor(this.y / limit)-2);
            let y_max = Math.floor(this.y / limit)+2;
            for (var i = x_min; i<x_max && i < sorted_preys.length; i++) {
                for (var j=y_min; j<y_max && j < sorted_preys[i].length; j++) {
                    sorted_preys[i][j].forEach((g) => {
                        dist = Math.hypot(this.x - g.x, this.y - g.y);
                        if ( dist < this.eatingDistance && grass.indexOf(g)>0) {
                            this.health += 1.5 + g.age/40 + g.bonus;
                            grass.splice (grass.indexOf(g), 1);
                            if (this.health > (this.max_health*3/4) && Math.random() < 0.4 ) {
                                this.health = this.health / 4;
                                let newPrey = new Prey(this);
                                preys.push(newPrey);
                            }
                        }
                        else if (dist < closest){
                            closest = dist;
                            found_grass = g;
                        }
                    });
                }
            }
            if (found_grass) {
                if (found_grass.x == this.x)
                    this.vx = 0;
                else
                    this.vx = (found_grass.x - this.x) / Math.abs(found_grass.x - this.x) * this.speed;
                if (found_grass.y == this.y)
                    this.vy = 0;
                else
                    this.vy = (found_grass.y - this.y) / Math.abs(found_grass.y - this.y) * this.speed;
            }
        }
    }
    
    draw(avg) {
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
	ctx.fillStyle = (this.speed>avg)?'purple':'orange';
	ctx.fill();
    }
}

class Grass {
    constructor(parent) {
        this.max_age = 400;
        this.reproduction_age = 40;
        this.offset = 800;
        if ( !parent ){
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.age = Math.random() * this.max_age - 50;
            this.color = 'green';
            this.bonus = (Math.random()<0.5)?0:1;
        }
        else {
            this.age = 0;
            //this.max_age = 300;//parent.max_age + (Math.random()-0.5)
            this.color='lightgreen';
            this.x = (Math.abs(parent.x + width +(Math.random()-0.5)*this.offset)) % width;
            this.y = (Math.abs(parent.y + height +(Math.random()-0.5)*this.offset)) % height;
            this.bonus = parent.bonus;
        }
        this.size = 2;
        grass.push(this);
    }

    draw() {
	ctx.beginPath();
	ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
	//ctx.fillStyle = (this.age>this.reproduction_age)?'green':'lightgreen';
        ctx.fillStyle = (this.bonus)?'green':'lightgreen';
	ctx.fill();
    }

    update() {
        if (this.age > this.reproduction_age  && grass.length < grassCount && Math.random() < 0.3) {
            let g = new Grass(this);
        }
        this.age +=1;
        //return;
        if (this.age > this.max_age) {
            grass.splice(grass.indexOf(this),1);
        }
    }
}


function insertPred() {
    // Create predators
    for (let i = 0; i < predatorCount; i++) {
        let predator = new Predator(null);
        predators.push(predator);
    }
}


// Create preys
function insertPreys() {
    for (let i = 0; i < preyCount; i++) {
        let prey = new Prey(null);
        preys.push(prey);
    }
}

insertPred();
insertPreys();
// init grass
for (let i = 0; i < 25000; i++) {
    let g = new Grass(null);
}


// Draw predators and preys
function draw(prey_avg) {
    ctx.clearRect(0, 0, width, height);
    grass.forEach((g) => {
        g.draw();
    });
    preys.forEach((prey) => {
	prey.draw(prey_avg);
    });
    predators.forEach((predator) => {
	predator.draw();
    });

}

function sort_preys( limit, source ) {
    preys_sorted = new Array(Math.floor(width/limit)+1);
    for (var i=0; i<preys_sorted.length ; i++) {
        preys_sorted[i] = new Array(Math.floor(height/limit)+1);
        for (var j=0; j<preys_sorted[i].length; j++) {
            preys_sorted[i][j] = new Array();
        }
    }
    source.forEach((s) => {
        preys_sorted[Math.floor(s.x/limit)][Math.floor(s.y/limit)].push(s)
    });
    return preys_sorted;
}

draw();

// Update predators and preys
function update() {
    time++;
    if (preys.length == 0){
        alert(time);
        pause();
        }

    let limit = 10;
    let sorted_grass = sort_preys(limit, grass);
    let avg = avg_speed = 0;
    let avg_mh_prey = 0;
    let prey_size = preys.length;
    preys.forEach(prey => {
        prey.update(sorted_grass, limit);
        avg+=prey.eatingDistance;
        avg_speed+=prey.speed;
        avg_mh_prey+=prey.max_health;
    });

    grass.forEach(grass => grass.update()) ;

    limit = 50;
    let sorted_preys = sort_preys(limit, preys);
    sum_p = 0;
    sum_size = predators.length;
    // Check for prey collision with predators
    predators.forEach((predator) => {
        predator.update()
        sum_p+=predator.max_age;
        found_next = false;
        if (predator.health > (predator.max_health *(3/4)) ) {
            // Create a new predator with slightly different position that is randomly chosen
            let newPredator = new Predator(predator);
            predators.push(newPredator);
            predator.health  = predator.health / 5;
        }

        var has_eaten = false
        closest_dist = 800;
        closest = null;
        if (predator.health < predator.max_health) {
            let x_min = Math.max(0,Math.floor(predator.x / limit)-2);
            let x_max = Math.floor(predator.x / limit)+2;
            let y_min = Math.max(0,Math.floor(predator.y / limit)-2);
            let y_max = Math.floor(predator.y / limit)+2;
            for (var i = x_min; i<x_max && i < sorted_preys.length; i++) {
                for (var j=y_min; j<y_max && j < sorted_preys[i].length; j++) {
                    sorted_preys[i][j].forEach((prey) => {
                        dist = Math.hypot(prey.x - predator.x, prey.y - predator.y);
                        if (!has_eaten && preys.indexOf(prey)>0){
                            eatingDistance = prey.size + predator.size;
                            if ( dist < eatingDistance) {
                                if( predator.max_health > predator.health) {
                                    predator.health += prey.health / 5;
		                }		
                                preys.splice(preys.indexOf(prey), 1);
                            }
                            else if (predator.health < predator.max_health && closest_dist > dist && dist < predator.vision) {
                                closest_dist = dist;
                                closest = prey;
                            }
                        }
                    });
                }
            }
            if (closest) {
                if (closest.x == predator.x)
                    predator.vx = 0;
                else
                    predator.vx = (closest.x - predator.x) / Math.abs(closest.x - predator.x) * predator.speed;
                if (closest.y == predator.y)
                    predator.vy = 0
                else
                    predator.vy = (closest.y - predator.y) / Math.abs(closest.y - predator.y) * predator.speed;
            }
        }
    });
    //updateChart(avg_speed / prey_size, sum_p/sum_size);
    //console.log("avg: "+sum_p/sum_size);
    draw(avg_speed/prey_size);
}

let paused = false;

// Call update() and draw() repeatedly to animate the simulation
function loop() {
    if (paused) return;
    update();
    requestAnimationFrame(loop);
}

loop();

let animationId;

function start() {
    paused = false;
    animationId = requestAnimationFrame(loop);
}

function pause() {
    paused = true;
}

function reset() {
    predators = [];
    preys = [];
    // Create predators
    for (let i = 0; i < predatorCount; i++) {
	let predator = new Predator(Math.random() * width, Math.random() * height);
	predators.push(predator);
    }
    // Create preys
    for (let i = 0; i < preyCount; i++) {
	let prey = new Prey(Math.random() * width, Math.random() * height);
	preys.push(prey);
    }
}

document.getElementById('start').addEventListener('click', start);
document.getElementById('pause').addEventListener('click', pause);
document.getElementById('reset').addEventListener('click', reset);
document.getElementById('preds').addEventListener('click', insertPred);
document.getElementById('preys').addEventListener('click', insertPreys);
