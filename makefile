GadgetHelper.dll: *.cs
	@echo * compiling...
	@csc /t:library /keyfile:sk.snk /out:GadgetHelper.dll *.cs

GadgetHelper.tlb: GadgetHelper.dll
	@echo * exporting table...
	@tlbexp GadgetHelper.dll /out:GadgetHelper.tlb

register: GadgetHelper.dll GadgetHelper.tlb
	@echo * registering...
	@regasm /tlb:GadgetHelper.tlb GadgetHelper.dll
	@gacutil /I GadgetHelper.dll

unregister: GadgetHelper.dll GadgetHelper.tlb
	@echo * unregistering...
	@regasm /unregister  /tlb:GadgetHelper.tlb GadgetHelper.dll
	@gacutil /u GadgetHelper.dll