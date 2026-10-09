// Fits a scene's camera to its design frame, now and on every resize (spec §10.4): the canvas fills its
// host and the whole frame shows, centred. `onView` gets the visible world rect (wider or taller than the frame).
import * as Phaser from 'phaser';
import { farmCamera, type WorldRect } from '../../systems/layout/camera';

export function fitCamera(
  scene: Phaser.Scene,
  design: { width: number; height: number },
  onView: (view: WorldRect) => void = () => {},
) {
  const apply = () => {
    const { zoom, view } = farmCamera(scene.scale.width, scene.scale.height, design.width, design.height);
    scene.cameras.main.setZoom(zoom).centerOn(design.width / 2, design.height / 2);
    onView(view);
  };
  apply();
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, apply));
}
