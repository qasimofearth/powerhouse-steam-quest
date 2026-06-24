import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'c', label: 'scenes.q23.c' },
    { value: 'a', label: 'scenes.q23.a' },
    { value: 'b', label: 'scenes.q23.b' },
    { value: 'd', label: 'scenes.q23.d' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
