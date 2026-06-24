import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'b', label: 'scenes.q21.b' },
    { value: 'a', label: 'scenes.q21.a' },
    { value: 'c', label: 'scenes.q21.c' },
    { value: 'd', label: 'scenes.q21.d' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
