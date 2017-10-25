var canvas = document.getElementById("canvas");
var processing = new Processing(canvas, function(processing) {
    processing.size(700, 700);
    processing.background(0xFFF);

    var mouseIsPressed = false;
    processing.mousePressed = function () { mouseIsPressed = true; };
    processing.mouseReleased = function () { mouseIsPressed = false; };

    var keyIsPressed = false;
    processing.keyPressed = function () { keyIsPressed = true; };
    processing.keyReleased = function () { keyIsPressed = false; };

    function getImage(s) {
	var url = "https://www.kasandbox.org/programming-images/" + s + ".png";
	processing.externals.sketch.imageCache.add(url);
	return processing.loadImage(url);
    }

    // use degrees rather than radians in rotate function
    var rotateFn = processing.rotate;
    processing.rotate = function (angle) {
	rotateFn(processing.radians(angle));
    };

    with (processing) {


	// INSERT YOUR KHAN ACADEMY PROGRAM HERE
	/****************
	 * This is basically me figuring out what would happen in agario if everyone was an ai. A rather stupid ai, but nonetheless...
	 * As you can see, they start out by eating the closest agar(food pellet). If there is another cell close by, they flee from it, which takes priority over eating, mostly. 
	 * Once they reach size 30, they split and form a new cell. The original cell loses 10 mass, and the new cell is comprised of this 10 mass. There is a configurable chance the spawned cell will mutate and become part of an opposing team.
	 * There is a limit to how many cells can be spawned at any given moment, and this eventually causes cells to grow beyond 30 mass.
	 * Once beyond 32 mass, cells will start ignoring agars, and instead focus on hunting down members of the opposing team.
	 * Assuming they somehow survive all of this, all cells will eventually die. They lifespans are configurable aswell.
	 * 
	 * I took the original mover code as a base, and constructed my cell code fom there. There are still a few leftover traces of the mover code, should you care to investigate.
	 ****************/
	var entities = [];
	var agars = [];
	var maxCells = 16;
	var maxAgars = 5000;
	var agarsPerTick = 2;
	var showMass = true;
	var lifeSpan = 600;//in seconds
	var maxMass = 1500;//surpassable only by eating other cells
	var minMass = 9;//any cell less than this mass dies.
	var mutationRate = 1;//In percentage points (WIP)
	var decayrate = 0.999;//default 0.998 DON'T CHANGE UNLESS YOU KNOW WHAT YER DOING

	var cells = [];

	var Agar = function() {
	    this.position = new PVector(random(width), random(height));
	    this.eaten = false;
	    this.color = color(random(255), random(255), random(255));
	    this.mass = 1;
	    for(var i = 0; i < cells.length; i++) {
		var targetVector = PVector.sub(cells[i].position, this.position);
		var targetDist = dist(0, 0, targetVector.x, targetVector.y);
		if(abs(targetDist) < cells[i].mass/2) {
		    this.eaten = true;
		    //println(this.mass);
		}
		//println(agars[i].eaten);
	    }
	};
	Agar.prototype.display = function() {
	    noStroke();
	    fill(this.color);
	    ellipse(this.position.x, this.position.y, 5, 5);
	}; 

	var Mover = function(x, y) {
	    this.position = new PVector(x, y);
	    this.velocity = new PVector(random(-20, 20), random(-20, 20));
	    this.acceleration = new PVector(0, 0);
	    this.topSpeed = 10;
	};
	var Cell = function(x, y, team) {
	    Mover.call(this, x, y);
	    this.prototype = Object.create(Mover.prototype);
	    this.team = team;//Stored as a number, represented as a color.
	    /**
	     * Red is 0
	     * Blue is 1
	     * Yellow is 2
	     **/
	    this.living = true;
	    this.mass = 10;
	    this.age = 0;
	};

	//creates an array of dead cells
	for(var i = 0; i < maxCells; i++) {
	    cells[i] = new Cell(0, 0);
	    cells[i].living = false;
	}

	Cell.prototype.display = function() {
	    if(this.team === 0) {
		fill(255, 0, 0);
		stroke(200, 0, 0);
	    }
	    else if(this.team === 1) {
		fill(0, 0, 255);
		stroke(0, 0, 200);
	    }
	    else if(this.team === 2) {
		fill(0, 255, 0);
		stroke(0, 200, 0);
	    } else { println("Error: invalid team."); }
	    strokeWeight(this.mass/8);
	    ellipse(this.position.x, this.position.y, this.mass, this.mass);
	    if(showMass) {
		textAlign(CENTER);
		fill(0, 0, 0);
		text(this.mass, this.position.x, this.position.y);
	    }
	};

	Cell.prototype.think = function() {
/*	    
	    //scan for conflict
	    var rivals = false;
	    for(var i = 0; i < cells.length; i++) {
		if(cells[i].team !== this.team) {
		    rivals = true; 
		}
	    }
	    
	    //find closest agar
	    var target = [];
	    target[0] = new PVector(agars[0].position.x, agars[0].position.y);
	    if(this.mass < maxMass - 5 ) {
		for(var i = 0; i < agars.length; i++) {
		    var targetDist = PVector.dist(target[0], this.position);
		    var agarDist = PVector.dist(this.position, agars[i].position);
		    if(targetDist > agarDist && agars[i].eaten === false)
		    {
			target[0] = new PVector(agars[i].position.x, agars[i].position.y);
		    }
		}
	    } else { target[0] = new PVector(400, 400); }
	    
	    //consider potential prey
	    for(var i = 0; i < cells.length; i++) {
		if(rivals && this.mass > 32) { 
		    target[0] = new PVector(cells[0].position.x, cells[0].position.y);
		}
		var targetDist = PVector.dist(target[0], this.position);
		var cellDist = PVector.dist(this.position, cells[i].position);
		if(targetDist > cellDist && cells[i].living && cells[i].team !== this.team && 
		   this.mass * 0.9 > cells[i].mass)
		{
		    target[0] = new PVector(cells[i].position.x, cells[i].position.y);
		}
	    }
	    
	    //Consider potential predators
	    var predators = 0;
	    for(var i = 0; i < cells.length; i++) {
		var targetDist = PVector.dist(target[0], this.position);
		var cellDist = PVector.dist(this.position, cells[i].position);
		if(cellDist < cells[i].mass  + 15 && cells[i].living && cells[i].team !== this.team && 
		   this.mass < cells[i].mass * 0.9)
		{
		    target[predators] = new PVector(cells[i].position.x, cells[i].position.y);
		    predators++;
		}
	    }
	    
	    if(predators > 0) {
		//flee predators
		var maxAcceleration = 100/this.mass;
		var acceleration = new PVector(0, 0);
		for(var i = 0; i < predators; i++) {
		    target[i].sub(this.position);
		    target[i].normalize();
		    target[i].mult(-maxAcceleration/predators);
		    acceleration.add(target[i]);
		}
		this.acceleration.set(acceleration);
	    } else {
		//accelerate towords prey
		target[0].sub(this.position);
		target[0].normalize();
		target[0].mult(50/this.mass);
		this.acceleration.set(target[0]);
	    }
	    
	    //convert target location to acceleration vector
	    if(predators < 0) {
	      target[0].sub(this.position);
	      target[0].normalize();
	      target[0].mult(50/this.mass);
	      this.acceleration.set(target);
	      }
*/
	    //Gravitational AI

	    this.acceleration.set(0, 0);
	 
	    for(var i = 0; i < agars.length; i++) {
		var force = new PVector(agars[i].position.x, agars[i].position.y);
		
		force.sub(this.position);
		force.normalize();
		force.mult(1/PVector.dist(this.position, agars[i].position));
		this.acceleration.add(force);
	    }
	    for(var i = 0; i < cells.length; i++) {
		if(cells[i].living) {
		    if(cells[i].mass < this.mass * 0.9) {
			var force = new PVector(cells[i].position.x, cells[i].position.y);
			force.sub(this.position);
			force.normalize();
			force.mult(cells[i].mass/PVector.dist(this.position, cells[i].position));
			this.acceleration.add(force);
		    } else if(cells[i].mass * 0.9 > this.mass) {
			var force = new PVector(cells[i].position.x, cells[i].position.y);
			force.sub(this.position);
			force.normalize();
			force.mult(dist(0, 0, cells[i].velocity.x, cells[i].velocity.y) / PVector.dist(this.position, cells[i].position));//cell velocity/distance
			this.acceleration.sub(force);
		    }
		}
	    }
	    this.acceleration.normalize();
	    this.acceleration.mult(sqrt(this.mass));
	    
	};

	Cell.prototype.checkEdges = function() {

	    if (this.position.x > width) {
		this.position.x = width;
	    } 
	    else if (this.position.x < 0) {
		this.position.x = 0;
	    }

	    if (this.position.y > height) {
		this.position.y = height;
	    }
	    
	    else if (this.position.y < 0) {
		this.position.y = 0;
	    }
	};

	Cell.prototype.update = function() {
	    
	    //Physics calculations
	    this.age += 1/30;
	    this.velocity.add(this.acceleration);
	    //var normvel = this.velocity
	    //normvel.normalize();
	    //normvel.mult(sqrt(this.mass));

	    this.velocity.limit(sqrt(this.mass), sqrt(this.mass));
	    
	    this.position.add(normvel); 
	    
	    //check for agars being eaten
	    for(var i = 0; i < agars.length; i++) {
		var targetVector = PVector.sub(agars[i].position, this.position);
		var targetDist = dist(0, 0, targetVector.x, targetVector.y);
		if(abs(targetDist) < this.mass/2 && this.mass < maxMass && agars[i].eaten === false) {
		    agars[i].eaten = true;
		    this.mass += agars[i].mass;
		    //println(this.mass);
		}
		//println(agars[i].eaten);
	    }
	    
	    //check for other cells being eaten
	    for(var i = 0; i < cells.length; i++) {
		var targetVector = PVector.sub(cells[i].position, this.position);
		var targetDist = dist(0, 0, targetVector.x, targetVector.y);
		if(abs(targetDist) < this.mass/2 && cells[i].living && this.mass * 0.9 > cells[i].mass && cells[i].team !== this.team) {
		    cells[i].living = false;
		    this.mass += cells[i].mass;
		}
	    }
	    
	    //cell decay/death
	    if(this.mass > minMass) {
		this.mass *= decayrate;
	    } else { this.living = false; }
	    
	    //reproduce
	    if(this.mass > 30) {
		var spawned = false;
		for(var i = 0; i < maxCells; i++) {
		    if(cells[i].living === false && spawned === false) {
			if(random(1) < mutationRate/100) {
			    cells[i] = new Cell(this.position.x + this.mass, this.position.y + this.mass, floor(random(3)));
			    spawned = true;
			} else {
			    cells[i] = new Cell(this.position.x, this.position.y, this.team);
			    this.mass -= 10;
			    spawned = true;
			}
		    }
		}
		
	    }
	    if(this.age > lifeSpan) {
		this.living = false;
	    }
	    //println(this.mass);
	};


	var updateAgars = function() {
	    var spawned = 0;
	    for(var i = 0; i < agars.length; i++) {
		if(agars[i].eaten && spawned < agarsPerTick) {
		    agars[i] = new Agar();
		    spawned++;
		} 
	    }
	    if(agars.length > maxAgars) {
		spawned = agarsPerTick;
	    }
	    while(spawned < agarsPerTick) {
		agars.push(new Agar());
		spawned++;
	    }
	    
	    for(var i = 0; i < agars.length; i++) {
		if(agars[i].eaten !== true) {
		    agars[i].display();
		}
		//println("agars[" + i + "] eaten = " + agars[i].eaten);
	    }
	};

	//spawn patriarchs
	cells[0] = new Cell(random(width), random(height), 0);
	cells[1] = new Cell(random(width), random(height), 1);
	cells[2] = new Cell(random(width), random(height), 2);

	var draw = function() {
	    //println("Frame count is " + frameCount );
	    background(255, 255, 255);
	    updateAgars();
	    //println(cells);
	    
	    for(var i = 0; i < cells.length; i++) {
		if(cells[i].living) {
		    cells[i].think();
		    cells[i].update();
		    cells[i].checkEdges();
		    cells[i].display();
		    //println("Cell " + i + " is at " + cells[i].position);
		}
	    }
	    //image(getImage("avatars/piceratops-tree"), 300, 300, 100, 100);
	};



    }
    if (typeof draw !== 'undefined') processing.draw = draw;
});

