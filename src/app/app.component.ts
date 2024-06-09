import {
  AfterViewInit,
  Component,
  NgZone,
  OnInit,
  inject,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MyButton } from './components/button';
import {
  Bodies,
  Body,
  Composite,
  Engine,
  Events,
  IMousePoint,
  Mouse,
  MouseConstraint,
  Query,
  Render,
  Runner,
  World,
} from 'matter-js';
import Victor from 'victor';
import { Subject, tap, throttleTime } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterModule, MyButton],
  selector: 'blob-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ng17-sun-1';
  engine = Engine.create({
    gravity: {
      y: 0,
    },
  });
  render = Render.create({
    element: document.body,
    engine: this.engine,
    options: {
      wireframes: false,
      height: 800,
      width: 1200,
    },
  });
  mouse: Mouse | undefined;
  mConstraint: MouseConstraint | undefined;
  playerState = {
    hp: 10,
  };
  boxA = Bodies.circle(400, 200, 40, {
    render: {
      sprite: {
        texture: './assets/blueb.png',
        xScale: 0.55,
        yScale: 0.55,
      },
    },
    restitution: 0, // bounce
  });
  boxB = Bodies.rectangle(450, 50, 80, 80, {
    render: {
      sprite: {
        texture: './assets/crow.png',
        xScale: 0.55,
        yScale: 0.55,
      },
    },
  });

  topWall = Bodies.rectangle(0, 0, 2400, 60, { isStatic: true });
  leftWall = Bodies.rectangle(0, 0, 60, 1600, { isStatic: true });
  bottomWall = Bodies.rectangle(0, 790, 2400, 60, { isStatic: true });
  rightWall = Bodies.rectangle(1190, 0, 60, 1600, { isStatic: true });

  keyHandlers: any = {
    KeyD: () => {
      Body.applyForce(
        this.boxA,
        {
          x: this.boxA.position.x,
          y: this.boxA.position.y,
        },
        { x: 0.008, y: 0 }
      );
    },
    KeyA: () => {
      Body.applyForce(
        this.boxA,
        {
          x: this.boxA.position.x,
          y: this.boxA.position.y,
        },
        { x: -0.008, y: 0 }
      );
    },
    KeyW: () => {
      Body.applyForce(
        this.boxA,
        {
          x: this.boxA.position.x,
          y: this.boxA.position.y,
        },
        { x: 0, y: -0.008 }
      );
    },
    KeyS: () => {
      // const collisions = Query.collides(this.boxA, [this.ground1]);
      // array destructuring, you can pull out however many you are interested in
      // and ignore the others
      // const [one, two, ...otherCollisions] = collisions;

      // if (collisions[0]) {
      // }
      Body.applyForce(
        this.boxA,
        {
          x: this.boxA.position.x,
          y: this.boxA.position.y,
        },
        { x: 0, y: 0.008 }
      );
    },
    // TODO: how to add jumping
  };

  keysDown = new Set();

  ngOnInit() {
    document.addEventListener('keydown', (event) => {
      this.keysDown.add(event.code);
    });
    document.addEventListener('keyup', (event) => {
      this.keysDown.delete(event.code);
    });
    Events.on(this.engine, 'beforeUpdate', () => {
      [...this.keysDown].forEach((k: unknown) => {
        this.keyHandlers[k as string]?.();
      });
    });

    Composite.add(this.engine.world, [
      this.boxA,
      this.boxB,
      this.topWall,
      this.leftWall,
      this.bottomWall,
      this.rightWall,
    ]);

    Render.run(this.render);
    const runner = Runner.create();
    Runner.run(runner, this.engine);

    this.mouse = Mouse.create(document.body);
    this.mConstraint = MouseConstraint.create(this.engine, {
      mouse: this.mouse,
    });

    World.add(this.engine.world, this.mConstraint);
  }

  zone = inject(NgZone);
  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      Events.on(this.mConstraint, 'mousedown', this.addEnemy.bind(this));
      Events.on(this.mConstraint, 'mousedown', (event) =>
        this.addBullet.bind(this)(
          event.source?.mouse.position,
          this.boxA.position
        )
      );

      // this is a browser api, all frames can access this without imports
      requestAnimationFrame(this.gameloop.bind(this));
    });
    this.enemies.push(this.boxB);
  }

  enemies: Matter.Body[] = [];
  bullets: Matter.Body[] = [];

  // hitEvent can be "next(...)"'d to, which triggers listeners on the hitEvent subject
  hitEvent = new Subject<number>();

  // when a hitEvent happens, we listen to it with this pipe and subscribe
  takeHits = this.hitEvent
    .pipe(
      throttleTime(1000),
      tap((dmg) => this.takeDamage(dmg)),
      tap((dmg) => this.displayDamageNumber(dmg))
    )
    .subscribe();

  playerHits() {
    if (this.playerState.hp > 0) {
      const collisions = Query.collides(this.boxA, this.enemies);
      collisions.forEach(() => {
        this.hitEvent.next(1);
      });
    }
  }

  takeDamage(dmg: number) {
    this.playerState.hp -= dmg;
    if (this.playerState.hp < 1) {
      Composite.remove(this.engine.world, [this.boxA]);
    }
  }

  damageNumbers: { damage: number; body: Matter.Body }[] = [];

  // TODO: update hitEvent with hit location, not just damage
  // TODO: make dmg numbers disappear after some time
  // dmg numbers don't interact, no collision with other objects
  displayDamageNumber(damage: number) {
    // get location of collision
    const body = Bodies.rectangle(450, 250, 80, 80, {
      // render: { opacity: 0 },
      isSensor: true,
    });
    // Create DOM elements that render our text
    // and track the positions of the elements using Matterjs
    this.damageNumbers.push({ body, damage });
    const randomX = Math.random() * 6 - 3;
    Body.setVelocity(body, new Victor(3 + randomX, -10));
    Composite.add(this.engine.world, [body]);
  }

  /**
   * convert a matter body position into left / top css coordinates
   * @param body
   * @returns string
   */
  getDamageLocation(body: Matter.Body) {
    return `
      left: ${body.position.x}px;
      top: ${body.position.y}px;

      width: ${body.bounds.min}px;
      height: ${body.bounds.min}px;
    `;
    // TODO: Find out how to get body height / width
  }

  enemyHits() {
    this.enemies.forEach((enemy) => {
      const enemyHits = Query.collides(enemy, this.bullets);
      enemyHits.forEach((hit) => {
        enemy.label = 'dead';
        hit.bodyB.label = 'dead';
      });
    });

    const deadEnemies = this.enemies.filter((enemy) => enemy.label === 'dead');
    const deadBullets = this.bullets.filter(
      (bullet) => bullet.label === 'dead'
    );

    // Removing Objects from Matterjs
    Composite.remove(this.engine.world, deadEnemies);
    Composite.remove(this.engine.world, deadBullets);

    // TODO: can we use this to track items in the world
    // Composite.get(this.engine.world, 1, '')

    // Removing objects from our data
    this.enemies = this.enemies.filter((enemy) => enemy.label !== 'dead');
    this.bullets = this.bullets.filter((bullet) => bullet.label !== 'dead');
  }

  gameloop() {
    this.playerHits();
    this.enemyHits();
    requestAnimationFrame(this.gameloop.bind(this));
  }

  addEnemy() {
    const enemy = Bodies.rectangle(450, 50, 80, 80, {
      render: {
        sprite: {
          texture: './assets/crow.png',
          xScale: 0.55,
          yScale: 0.55,
        },
      },
    });
    this.enemies.push(enemy);
    Composite.add(this.engine.world, [enemy]);
  }

  // some sort of game AI to move towards player and attack them
  // the game AI could have special routines that they perform

  addBullet(
    mousePosition: IMousePoint | undefined,
    playerPosition: Matter.Vector
  ) {
    if (mousePosition && this.playerState.hp > 0) {
      const _playerPosition = new Victor(playerPosition.x, playerPosition.y);
      const _mousePosition = new Victor(mousePosition.x, mousePosition.y);
      const _direction = _mousePosition.subtract(_playerPosition).normalize();

      const bullet = Bodies.rectangle(
        this.boxA.position.x,
        this.boxA.position.y,
        15,
        15,
        {
          render: {
            sprite: {
              texture: './assets/crabboid.png',
              xScale: 0.1,
              yScale: 0.1,
            },
          },
          restitution: 1,
        }
      );
      this.bullets.push(bullet);
      Body.setVelocity(bullet, _direction.multiply(new Victor(5, 5)));
      Composite.add(this.engine.world, [bullet]);
    }
  }
}
