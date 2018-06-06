var game;

var gameOptions = {
    // per frame
    rotationSpeed: 3,

    // milliseconds
    throwSpeed: 150,

    // minimum angle between two fork
    minAngle: 15
}

window.onload = function() {
    var gameConfig = {
        type: Phaser.CANVAS,
        width: 750,
        height: 1334,
        backgroundColor: 0x444444,
        scene: [playGame]
    };

    game = new Phaser.Game(gameConfig);

    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}

class playGame extends Phaser.Scene{

    constructor() {
        super("PlayGame");
    }

    // scene preloads
    preload() {
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillStyle(240, 270, 320, 50);

        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        var percentText = this.make.text({
            x: width / 2,
            y: height / 2 - 5,
            text: '0%',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        var assetText = this.make.text({
            x: width / 2,
            y: height / 2 + 50,
            text: '',
            style: {
                font: '18px monospace',
                fill: '#ffffff'
            }
        });
        assetText.setOrigin(0.5, 0.5);

        this.load.on('progress', function (value) {
            percentText.setText(parseInt(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });

        this.load.on('fileprogress', function (file) {
            assetText.setText('Loading asset: ' + file.key);
        });

        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
            assetText.destroy();
        });

        this.load.image('logo', 'assets/playhard_logo.png');
        for (var i = 0; i < 500; i++) {
            this.load.image('File'+i, 'assets/playhard_logo.png');
        }

        this.load.image("target", "assets/target.png");
        this.load.image("fork", "assets/fork.png");
    }

    create() {
        var logo = this.add.image(game.config.width / 2, 148, 'logo');

        this.canThrow = true;

        this.forkGroup = this.add.group();

        this.fork = this.add.sprite(game.config.width / 2, game.config.height / 5 * 4, "fork");

        this.target = this.add.sprite(game.config.width / 2, 400, "target");

        this.target.depth = 1;

        this.input.on("pointerdown", this.throwFork, this);
    }

    // method to throw a fork
    throwFork() {
        if(this.canThrow) {
            this.canThrow = false;

            this.tweens.add({
                targets: [this.fork],
                y: this.target.y + this.target.width / 2,
                duration: gameOptions.throwSpeed,
                callbackScope: this,
                onComplete: function(tween){

                    // at the moment, this is a legal hit
                    var legalHit = true;

                    // getting an array with all rotating forks
                    var children = this.forkGroup.getChildren();

                    // looping through rotating forks
                    for (var i = 0; i < children.length; i++) {
                        // is the fork too close to the i-th fork?
                        if(Math.abs(Phaser.Math.Angle.ShortestBetween(this.target.angle, children[i].impactAngle)) < gameOptions.minAngle) {
                            // this is not a legal hit
                            legalHit = false;

                            // no need to continue with the loop;
                            break;
                        }
                    }

                    // is this a legal hit?
                    if(legalHit) {
                        // player can now throw again
                        this.canThrow = true;

                        // adding the rotating fork in the same place of the fork just landed on target
                        var fork = this.add.sprite(this.fork.x, this.fork.y, "fork");

                        // impactAngle property saves the target angle when the fork hits the target
                        fork.impactAngle = this.target.angle;

                        // adding the rotating fork to forkGroup group
                        this.forkGroup.add(fork);

                        //bringing back the fork to its starting position
                        this.fork.y = game.config.height / 5 * 4;
                    }
                    // in case this is not a legal hit
                    else {
                        this.tweens.add({
                            // adding the fork to tween targets
                            targets: [this.fork],

                            // y destination
                            y: game.config.height + this.fork.height,

                            // rotation destination, in radians
                            rotation: 5,

                            // tween duration
                            duration: gameOptions.throwSpeed * 4,

                            // callback scope
                            callbackScope: this,

                            // function to be executed once the tween has been completed
                            onComplete: function(tween){
                                // restart the game
                                this.scene.start("PlayGame");
                            }
                        });
                    }

                }
            });
        }
    }

    // method to be executed at each frame
    update() {
        // rotating the target
        this.target.angle += gameOptions.rotationSpeed;

        var children = this.forkGroup.getChildren();

        // looping through rotating forks
        for (var i = 0; i < children.length; i++) {
            children[i].angle += gameOptions.rotationSpeed;

            // turning fork angle in radians
            var radians = Phaser.Math.DegToRad(children[i].angle + 90);

            // trigonometry to make the knife rotate around target center
            children[i].x = this.target.x + (this.target.width / 2) * Math.cos(radians);
            children[i].y = this.target.y + (this.target.width / 2) * Math.sin(radians);
        }
    }

}

// pure javascript to scale the game
function resize() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    } else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
