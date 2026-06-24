import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'c', label: 'scenes.q17.c' },
    { value: 'a', label: 'scenes.q17.a' },
    { value: 'b', label: 'scenes.q17.b' },
    { value: 'd', label: 'scenes.q17.d' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
