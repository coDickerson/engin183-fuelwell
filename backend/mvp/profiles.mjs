// Fictional teaching profiles. These are never presented as clinician-approved plans.
export const profiles = {
  fung: {
    id: 'fung', name: 'Fung', relation: 'Mom', condition: 'CKD G3b, not on dialysis', dialysis: false,
    cuisine: 'Cantonese home cooking', preferences: ['ginger', 'scallion', 'rice', 'steamed fish'],
    plan: { status: 'sample', source: 'Fictional dietitian handout for product review', reviewedAt: null,
      priorities: ['Pay attention to sodium in sauces and broths', 'Keep familiar dishes recognizable', 'Avoid assuming a daily potassium or phosphorus limit without a reviewed plan'],
      targets: { sodium: null, potassium: null, phosphorus: null, protein: null } },
  },
  sam: {
    id: 'sam', name: 'Sam', relation: 'Dad', condition: 'Receiving hemodialysis', dialysis: true,
    cuisine: 'Mexican home cooking', preferences: ['corn tortillas', 'chicken', 'cilantro'],
    plan: { status: 'sample', source: 'Fictional dialysis discussion example', reviewedAt: null,
      priorities: ['Keep adequate protein in meal ideas', 'Pay attention to sodium in restaurant food and packaged sauces', 'Fluid and mineral targets need the dialysis dietitian’s plan'],
      targets: { sodium: null, potassium: null, phosphorus: null, protein: null } },
  },
};
