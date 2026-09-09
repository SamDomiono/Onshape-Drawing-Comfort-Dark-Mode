# Renderer findings

These findings are supplied by SOL in the commissioning handoff. They are not new runtime experiments performed during this phase.

- Surround: XeLayoutPaper.m_PaperBackColor.
- Surround numeric format: 0xBBGGRR.
- Sheet: PaperOptimized material color uses normalized RGB components.
- Foreground: palette[7].
- Live dimension sample: visible chunks use ByACI 7. This sample does not establish behavior for all dimensions.
- Independent dimension recoloring remains optional.
- Redraw: invalidateScene() is the reported redraw mechanism. The existing source requests it after verified color writes and reports redraw exceptions separately without undoing those writes. No additional redraw guarantees are established here.
- Warning: renderer color structures do not all use the same packed format. Do not generalize the surround encoding to other color structures.

The preserved source still labels surround encoding provisional in a comment and diagnostic output. The supplied 0xBBGGRR finding is recorded for subsequent review without changing the baseline source.
