import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MyButton } from './components/button';
import { Bodies, Composite, Engine, Render, Runner, World } from 'matter-js';

@Component({
  standalone: true,
  imports: [RouterModule, MyButton],
  selector: 'blob-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'ng17-sun-1';
  engine = Engine.create({});
  render = Render.create({
    element: document.body,
    engine: this.engine,
  });
  boxA = Bodies.rectangle(400, 200, 80, 80, {});
  boxB = Bodies.rectangle(450, 50, 80, 80);
  ground1 = Bodies.rectangle(400, 400, 800, 60, { isStatic: true });

  ngOnInit() {
    Composite.add(this.engine.world, [this.boxA, this.boxB, this.ground1]);

    Render.run(this.render);
    const runner = Runner.create();
    Runner.run(runner, this.engine);

    // World.add(this.engine.world)
  }
}
