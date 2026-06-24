import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'b', label: 'scenes.q15.b' },
    { value: 'a', label: 'scenes.q15.a' },
    { value: 'c', label: 'scenes.q15.c' },
    { value: 'd', label: 'scenes.q15.d' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
