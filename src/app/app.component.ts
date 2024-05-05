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
  Composite,
  Engine,
  Mouse,
  MouseConstraint,
  Query,
  Render,
  Runner,
  World,
} from 'matter-js';

@Component({
  standalone: true,
  imports: [RouterModule, MyButton],
  selector: 'blob-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'ng17-sun-1';
  engine = Engine.create({});
  render = Render.create({
    element: document.body,
    engine: this.engine,
    options: {
      wireframes: false,
    },
  });

  mouse: Mouse | undefined;
  mConstraint: MouseConstraint | undefined;

  boxA = Bodies.circle(400, 200, 40, {
    render: {
      sprite: {
        texture: './assets/blueb.png',
        xScale: 0.55,
        yScale: 0.55,
      },
    },
    restitution: 1, // bounce
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
  ground1 = Bodies.rectangle(400, 400, 800, 60, { isStatic: true });

  ngOnInit() {
    Composite.add(this.engine.world, [this.boxA, this.boxB, this.ground1]);

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
      // this is a browser api, all frames can access this without imports
      requestAnimationFrame(this.gameloop.bind(this));
    });
    this.enemies.push(this.boxB);
  }

  enemies: Matter.Body[] = [];
  gameloop() {
    // console.log('hi', this.boxA);
    const collisions = Query.collides(this.boxA, this.enemies);

    collisions.forEach((collision) => {
      console.log('bumped', collision);
      collision.bodyA; // always the first parameter for Query.collides
      collision.bodyB; // always an item in the second parameter
      // calculate hp
      // or delete things that touch a particular object
    });

    // the requestAnimationFrame runs every 16ms
    // requestAnimationFrame runs at different speeds, if you have a fast machine
    // it could do more frames per second, e.g. 12ms
    // if it is a slow machine, it might do 25ms
    requestAnimationFrame(this.gameloop.bind(this));
  }
}
