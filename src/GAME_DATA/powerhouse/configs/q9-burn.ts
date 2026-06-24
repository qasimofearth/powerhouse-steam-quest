import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'b', label: 'scenes.q9.b' },
    { value: 'a', label: 'scenes.q9.a' },
    { value: 'd', label: 'scenes.q9.d' },
    { value: 'c', label: 'scenes.q9.c' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
