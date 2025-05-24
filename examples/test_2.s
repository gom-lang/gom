	.section	__TEXT,__text,regular,pure_instructions
	.build_version macos, 14, 0
	.globl	_square                         ; -- Begin function square
	.p2align	2
_square:                                ; @square
	.cfi_startproc
; %bb.0:                                ; %entry
	sub	sp, sp, #16
	.cfi_def_cfa_offset 16
	mov	w8, w0
	mul	w0, w0, w0
	str	w8, [sp, #12]
	add	sp, sp, #16
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_add                            ; -- Begin function add
	.p2align	2
_add:                                   ; @add
	.cfi_startproc
; %bb.0:                                ; %entry
	sub	sp, sp, #16
	.cfi_def_cfa_offset 16
	mov	w8, w0
	add	w0, w0, w1
	stp	w1, w8, [sp, #8]
	add	sp, sp, #16
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_distance                       ; -- Begin function distance
	.p2align	2
_distance:                              ; @distance
	.cfi_startproc
; %bb.0:                                ; %entry
	sub	sp, sp, #48
	stp	x20, x19, [sp, #16]             ; 16-byte Folded Spill
	stp	x29, x30, [sp, #32]             ; 16-byte Folded Spill
	.cfi_def_cfa_offset 48
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	.cfi_offset w19, -24
	.cfi_offset w20, -32
	sub	w8, w0, w2
	stp	w0, w1, [sp, #8]
	mov	w0, w8
	stp	w2, w3, [sp]
	bl	_square
	ldr	w8, [sp, #12]
	mov	w19, w0
	ldr	w9, [sp, #4]
	sub	w0, w8, w9
	bl	_square
	add	w0, w19, w0
	ldp	x29, x30, [sp, #32]             ; 16-byte Folded Reload
	ldp	x20, x19, [sp, #16]             ; 16-byte Folded Reload
	add	sp, sp, #48
	ret
	.cfi_endproc
                                        ; -- End function
	.globl	_main                           ; -- Begin function main
	.p2align	2
_main:                                  ; @main
	.cfi_startproc
; %bb.0:                                ; %entry
	sub	sp, sp, #96
	stp	x22, x21, [sp, #48]             ; 16-byte Folded Spill
	stp	x20, x19, [sp, #64]             ; 16-byte Folded Spill
	stp	x29, x30, [sp, #80]             ; 16-byte Folded Spill
	.cfi_def_cfa_offset 96
	.cfi_offset w30, -8
	.cfi_offset w29, -16
	.cfi_offset w19, -24
	.cfi_offset w20, -32
	.cfi_offset w21, -40
	.cfi_offset w22, -48
	mov	x8, #1
	mov	x9, #3
	movk	x8, #2, lsl #32
	movk	x9, #4, lsl #32
	mov	w0, #1
	mov	w1, #2
	mov	w2, #3
	mov	w3, #4
	stp	x9, x8, [sp, #32]
	bl	_distance
	mov	w19, w0
	str	w0, [sp, #28]
Lloh0:
	adrp	x0, l_.strliteral@PAGE
Lloh1:
	add	x0, x0, l_.strliteral@PAGEOFF
	bl	_printf
Lloh2:
	adrp	x20, l_fmt.int@PAGE
	str	x19, [sp]
Lloh3:
	add	x20, x20, l_fmt.int@PAGEOFF
	mov	x0, x20
	bl	_printf
Lloh4:
	adrp	x19, l_newline@PAGE
Lloh5:
	add	x19, x19, l_newline@PAGEOFF
	mov	x0, x19
	bl	_printf
	ldp	w0, w1, [sp, #40]
	ldp	w2, w3, [sp, #32]
	stp	w0, w1, [sp, #8]
	stp	w2, w3, [sp, #16]
	bl	_distance
	mov	w21, w0
Lloh6:
	adrp	x0, l_.strliteral.1@PAGE
Lloh7:
	add	x0, x0, l_.strliteral.1@PAGEOFF
	bl	_printf
	mov	x0, x20
	str	x21, [sp]
	bl	_printf
	mov	x0, x19
	bl	_printf
	ldp	x29, x30, [sp, #80]             ; 16-byte Folded Reload
	ldp	x20, x19, [sp, #64]             ; 16-byte Folded Reload
	ldp	x22, x21, [sp, #48]             ; 16-byte Folded Reload
	add	sp, sp, #96
	ret
	.loh AdrpAdd	Lloh6, Lloh7
	.loh AdrpAdd	Lloh4, Lloh5
	.loh AdrpAdd	Lloh2, Lloh3
	.loh AdrpAdd	Lloh0, Lloh1
	.cfi_endproc
                                        ; -- End function
	.section	__TEXT,__cstring,cstring_literals
l_.strliteral:                          ; @.strliteral
	.asciz	"Distance between p1 and p2: "

l_fmt.int:                              ; @fmt.int
	.asciz	"%d"

l_newline:                              ; @newline
	.asciz	"\n"

l_.strliteral.1:                        ; @.strliteral.1
	.asciz	"Distance between l.p1 and l.p2: "

.subsections_via_symbols
