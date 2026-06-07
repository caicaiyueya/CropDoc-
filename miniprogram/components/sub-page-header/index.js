Component({
  properties: {
    title: { type: String, value: '' },
    titleSuffix: { type: String, value: '' },
    statusBarHeight: { type: Number, value: 44 },
    headerMinHeight: { type: Number, value: 140 },
    variant: { type: String, value: 'default' },
    tier: { type: String, value: 'primary' },
    showBack: { type: Boolean, value: true }
  },
  methods: {
    onBack() {
      this.triggerEvent('back')
    }
  }
})
