backform-select2
=========

Add ability to render [select2](https://select2.github.io/) powered select inputs to your Backform forms.

## Installation

  `npm install select2 backform-select2`

## Usage
In your Backform field definiton you can use `Backform.Select2Control` as a `control`. Like this:

    var fields = [
        ...
        {
          name: 'countries',
          label: 'Countries',
          control: Backform.Select2Control
        }
        ...
    ];
You can pass select2 options with the `select2` key:

    {
      name: 'countries',
      select2: {
        multiple: true
      }
      label: 'Countries',
      control: Backform.Select2Control
    }
