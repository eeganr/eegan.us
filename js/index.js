function switchVisible() {
            if (document.getElementById('box')) {
	                if (document.getElementById('box').style.display == 'none') {
                    document.getElementById('box').style.display = 'block';
                    document.getElementById('dirbox').style.display = 'none';
                }
                else {
                    document.getElementById('box').style.display = 'none';
                    document.getElementById('dirbox').style.display = 'block';
                }
            }
}

window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
})();


function Vector(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Vector.scale = function(v, s) {
    return v.clone().scale(s);
};


Vector.prototype = {
    set: function(x, y) {
        if (typeof x === 'object') {
            y = x.y;
            x = x.x;
        }
        this.x = x || 0;
        this.y = y || 0;
        return this;
    },

    add: function(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    },

    scale: function(s) {
        this.x *= s;
        this.y *= s;
        return this;
    },

    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    normalize: function() {
        var m = Math.sqrt(this.x * this.x + this.y * this.y);
        if (m) {
            this.x /= m;
            this.y /= m;
        }
        return this;
    },
};


function Particle(x, y, radius) {
    Vector.call(this, x, y);
    this.radius = radius;

    this._latest = new Vector();
    this._speed  = new Vector();
}

Particle.prototype = (function(o) {
    var s = new Vector(0, 0), p;
    for (p in o) s[p] = o[p];
    return s;
})({
    addSpeed: function(d) {
        this._speed.add(d);
    },

    update: function() {
        if (this._speed.length() > 12) this._speed.normalize().scale(12);

        this._latest.set(this);
        this.add(this._speed);
    }

});

// Initialize
(function() {

    // Configs
    var BACKGROUND_COLOR      = 'rgba(69, 74, 77, 1)',
        PARTICLE_RADIUS       = 2;


    // Vars
    var canvas, context,
        bufferCvs, bufferCtx,
        screenWidth, screenHeight,
        particles = [],
        grad;


    // Event Listeners
    function resize(e) {
        screenWidth  = canvas.width  = window.innerWidth;
        screenHeight = canvas.height = window.innerHeight;
        bufferCvs.width  = screenWidth;
        bufferCvs.height = screenHeight;
        context   = canvas.getContext('2d');
        bufferCtx = bufferCvs.getContext('2d');

        var cx = canvas.width * 0.5,
            cy = canvas.height * 0.5;

        grad = context.createRadialGradient(cx, cy, 0, cx, cy, Math.sqrt(cx * cx + cy * cy));
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    }

    function scram(e) {

        for (i=0; i<particles.length; i++) {
            if (Math.hypot(particles[i].x - e.clientX, particles[i].y - e.clientY) < 100) {
                particles[i]._speed = new Vector(particles[i].x - e.clientX , particles[i].y - e.clientY).normalize().scale(10);
            }
        }
    }



    function addInitialParticles(num) {
        var i, p;
        for (i = 0; i < num; i++) {
            p = new Particle(
                Math.floor((Math.random() * screenWidth - PARTICLE_RADIUS * 2)) + 1 + PARTICLE_RADIUS,
                Math.floor((Math.random() * screenHeight - PARTICLE_RADIUS * 2)) + 1 + PARTICLE_RADIUS,
                PARTICLE_RADIUS
            );
            p.addSpeed(new Vector(Math.random()/2, Math.random()+0.2));
            particles.push(p);
        }
    }

    function addParticle(num) {
        var i, p;
        for (i = 0; i < num; i++) {
            p = new Particle(
                Math.floor((Math.random() * screenWidth - PARTICLE_RADIUS * 2)) + 1 + PARTICLE_RADIUS,
                - PARTICLE_RADIUS,
                PARTICLE_RADIUS
            );
            p.addSpeed(new Vector(Math.random()/2, Math.random()));
            particles.push(p);
        }
    }

    // Init
    canvas  = document.getElementById('c');
    bufferCvs = document.createElement('canvas');

    window.addEventListener('resize', resize, false);
    resize(null);

    addInitialParticles(1000);

    canvas.addEventListener('mousedown', scram, false);

    var loop = function() {
        var i, len, g, p;

        context.save();
        context.fillStyle = BACKGROUND_COLOR;
        context.fillRect(0, 0, screenWidth, screenHeight);
        context.fillStyle = grad;
        context.fillRect(0, 0, screenWidth, screenHeight);
        context.restore();

        addParticle(1);

        for (i = 0, len = particles.length; i < len; i++) {
            if (particles[i].y > screenHeight || particles[i].x > screenWidth || particles[i].x < -10 || particles[i].y < -10) {
                particles.splice(i, 1);
                break;
            }
        }

        bufferCtx.save();
        bufferCtx.globalCompositeOperation = 'destination-out';
        bufferCtx.globalAlpha = 0.35;
        bufferCtx.fillRect(0, 0, screenWidth, screenHeight);
        bufferCtx.restore();
        len = particles.length;
        bufferCtx.save();
        bufferCtx.fillStyle = bufferCtx.strokeStyle = '#4291ad';
        bufferCtx.lineCap = bufferCtx.lineJoin = 'circle';
        bufferCtx.lineWidth = PARTICLE_RADIUS * 3;
        bufferCtx.beginPath();
        for (i = 0; i < len; i++) {
            p = particles[i];
            p.update();
            bufferCtx.moveTo(p.x, p.y);
            bufferCtx.lineTo(p._latest.x, p._latest.y);
        }
        bufferCtx.stroke();
        bufferCtx.beginPath();
        for (i = 0; i < len; i++) {
            p = particles[i];
            bufferCtx.moveTo(p.x, p.y);
            bufferCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2, false);
        }
        bufferCtx.fill();
        bufferCtx.restore();

        context.drawImage(bufferCvs, 0, 0);

        requestAnimationFrame(loop);
    };
    loop();

})();
