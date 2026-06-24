import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'b', label: 'scenes.q4.b' },
    { value: 'a', label: 'scenes.q4.a' },
    { value: 'c', label: 'scenes.q4.c' },
    { value: 'd', label: 'scenes.q4.d' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
