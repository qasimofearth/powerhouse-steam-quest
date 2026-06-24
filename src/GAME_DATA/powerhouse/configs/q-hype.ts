import { RadioButtonInteraction } from '../interactives/interface';

const interaction: RadioButtonInteraction = {
  type: 'radio-button',
  title: '',
  options: [
    { value: 'c', label: 'scenes.qhype.c' },
    { value: 'a', label: 'scenes.qhype.a' },
    { value: 'd', label: 'scenes.qhype.d' },
    { value: 'b', label: 'scenes.qhype.b' },
  ],
  correctnessFunction: (selectedValue: string) => selectedValue === 'a',
};

export default interaction;
