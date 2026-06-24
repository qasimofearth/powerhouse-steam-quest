import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'c', label: 'scenes.q7.c' },
    { value: 'a', label: 'scenes.q7.a' },
    { value: 'd', label: 'scenes.q7.d' },
    { value: 'b', label: 'scenes.q7.b' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
