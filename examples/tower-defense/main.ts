import {Demo} from '../shared/demo/Demo';
import {requireElement} from '../shared/demo/requireElement';
import {TowerDefensePage} from './TowerDefensePage';

void Demo.mount(requireElement('game'), new TowerDefensePage());
