import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'b', label: 'scenes.qscale.b' },
    { value: 'a', label: 'scenes.qscale.a' },
    { value: 'd', label: 'scenes.qscale.d' },
    { value: 'c', label: 'scenes.qscale.c' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
