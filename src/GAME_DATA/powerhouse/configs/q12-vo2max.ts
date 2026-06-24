import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'c', label: 'scenes.q12.c' },
    { value: 'a', label: 'scenes.q12.a' },
    { value: 'b', label: 'scenes.q12.b' },
    { value: 'd', label: 'scenes.q12.d' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
