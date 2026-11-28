# probe3: do needs/vars in a composite step's if: resolve to real values?

Pushed into the existing scratch repo candavere/actioncheck-probe2 (variable X=probe-value is already set).

Expected if if: really resolves needs/vars:
- PROBE3 p3-needs-eq ran, p3-needs-wrapped ran, p3-vars-eq ran, p3-vars-wrapped ran: present
- PROBE3 p3-needs-neg ran, p3-vars-neg ran: ABSENT
- SUMMARY3: the six needs_/vars_ outcomes = success
- bogus_if: a control. failure + "Unrecognized named-value: 'bogus'" means if: validates context names (so accepting needs/vars is real support). success means if: does not validate names; report it.
