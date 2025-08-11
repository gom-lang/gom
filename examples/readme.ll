; ModuleID = 'mod'
source_filename = "mod"

%Temperature = type { i32, i32, i32 }
%Numbers = type { i32*, i32, i32 }

@.strliteral = private unnamed_addr constant [4 x i8] c"a: \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1
@.strliteral.1 = private unnamed_addr constant [22 x i8] c"Average temperature: \00", align 1
@.strliteral.2 = private unnamed_addr constant [17 x i8] c"Number at index \00", align 1
@.strliteral.3 = private unnamed_addr constant [5 x i8] c" is \00", align 1
@.strliteral.4 = private unnamed_addr constant [17 x i8] c"Numbers length: \00", align 1
@.strliteral.5 = private unnamed_addr constant [13 x i8] c"After push: \00", align 1
@.strliteral.6 = private unnamed_addr constant [17 x i8] c"Popped element: \00", align 1
@.strliteral.7 = private unnamed_addr constant [12 x i8] c"After pop: \00", align 1

declare i32 @printf(i8*, ...)

declare i8* @malloc(i32)

declare i8* @realloc(i8*, i32)

define void @main() {
entry:
  %a = alloca i32, align 4
  store i32 1, i32* %a, align 4
  store i32 1, i32* %a, align 4
  %a.load = load i32, i32* %a, align 4
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @.strliteral, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %a.load)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %temperature = alloca %Temperature, align 8
  %fieldptr = getelementptr %Temperature, %Temperature* %temperature, i32 0, i32 0
  store i32 32, i32* %fieldptr, align 4
  %fieldptr1 = getelementptr %Temperature, %Temperature* %temperature, i32 0, i32 1
  store i32 26, i32* %fieldptr1, align 4
  %fieldptr2 = getelementptr %Temperature, %Temperature* %temperature, i32 0, i32 2
  store i32 29, i32* %fieldptr2, align 4
  %fieldptr3 = getelementptr %Temperature, %Temperature* %temperature, i32 0, i32 2
  %fieldload = load i32, i32* %fieldptr3, align 4
  %calltmp04 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([22 x i8], [22 x i8]* @.strliteral.1, i32 0, i32 0))
  %calltmp15 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload)
  %newline6 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %numbers = alloca %Numbers, align 8
  %data_ptr_ptr = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 0
  %size_ptr = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %capacity_ptr = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 2
  store i32 16, i32* %capacity_ptr, align 4
  store i32 5, i32* %size_ptr, align 4
  %malloc_call = call i8* @malloc(i32 64)
  %data_alloca = bitcast i8* %malloc_call to i32*
  store i32* %data_alloca, i32** %data_ptr_ptr, align 8
  %element_ptr = getelementptr inbounds i32, i32* %data_alloca, i32 0
  store i32 1, i32* %element_ptr, align 4
  %element_ptr7 = getelementptr inbounds i32, i32* %data_alloca, i32 1
  store i32 2, i32* %element_ptr7, align 4
  %element_ptr8 = getelementptr inbounds i32, i32* %data_alloca, i32 2
  store i32 3, i32* %element_ptr8, align 4
  %element_ptr9 = getelementptr inbounds i32, i32* %data_alloca, i32 3
  store i32 4, i32* %element_ptr9, align 4
  %element_ptr10 = getelementptr inbounds i32, i32* %data_alloca, i32 4
  store i32 5, i32* %element_ptr10, align 4
  %i = alloca i32, align 4
  store i32 0, i32* %i, align 4
  store i32 0, i32* %i, align 4
  br label %loop

loop:                                             ; preds = %loopupdate, %entry
  %i.load = load i32, i32* %i, align 4
  %size_ptr11 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value = load i32, i32* %size_ptr11, align 4
  %lttmp = icmp slt i32 %i.load, %size_value
  br i1 %lttmp, label %loopbody, label %afterloop

loopbody:                                         ; preds = %loop
  %i.load12 = load i32, i32* %i, align 4
  %i.load13 = load i32, i32* %i, align 4
  %data_ptr_ptr14 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %data_ptr = load i32*, i32** %data_ptr_ptr14, align 8
  %element_ptr15 = getelementptr inbounds i32, i32* %data_ptr, i32 %i.load13
  %element_load = load i32, i32* %element_ptr15, align 4
  %calltmp016 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @.strliteral.2, i32 0, i32 0))
  %calltmp117 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %i.load12)
  %calltmp2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.strliteral.3, i32 0, i32 0))
  %calltmp3 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %element_load)
  %newline18 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate

loopupdate:                                       ; preds = %loopbody
  %i.load19 = load i32, i32* %i, align 4
  %addtmp = add i32 %i.load19, 1
  store i32 %addtmp, i32* %i, align 4
  br label %loop

afterloop:                                        ; preds = %loop
  %size_ptr20 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value21 = load i32, i32* %size_ptr20, align 4
  %calltmp022 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @.strliteral.4, i32 0, i32 0))
  %calltmp123 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %size_value21)
  %newline24 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %list.data.ptrptr = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %list.size.ptr = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 1
  %list.cap.ptr = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 2
  %list.size = load i32, i32* %list.size.ptr, align 4
  %list.cap = load i32, i32* %list.cap.ptr, align 4
  %cap.iszero = icmp eq i32 %list.cap, 0
  br i1 %cap.iszero, label %list.needinit, label %list.growthcheck

list.needinit:                                    ; preds = %afterloop
  %list.init.malloc = call i8* @malloc(i32 64)
  %list.init.dataptr = bitcast i8* %list.init.malloc to i32*
  store i32* %list.init.dataptr, i32** %list.data.ptrptr, align 8
  store i32 16, i32* %list.cap.ptr, align 4
  br label %list.growthcheck

list.growthcheck:                                 ; preds = %list.needinit, %afterloop
  %0 = load i32, i32* %list.size.ptr, align 4
  %1 = load i32, i32* %list.cap.ptr, align 4
  %list.needgrow = icmp sge i32 %0, %1
  br i1 %list.needgrow, label %list.grow, label %list.cont

list.grow:                                        ; preds = %list.growthcheck
  %list.newcap = mul i32 %1, 2
  %list.newbytes = mul i32 %list.newcap, 4
  %list.olddataptr = load i32*, i32** %list.data.ptrptr, align 8
  %list.olddatai8 = bitcast i32* %list.olddataptr to i8*
  %list.realloc = call i8* @realloc(i8* %list.olddatai8, i32 %list.newbytes)
  %list.growndataptr = bitcast i8* %list.realloc to i32*
  store i32* %list.growndataptr, i32** %list.data.ptrptr, align 8
  store i32 %list.newcap, i32* %list.cap.ptr, align 4
  br label %list.cont

list.cont:                                        ; preds = %list.grow, %list.growthcheck
  %list.dataptr = load i32*, i32** %list.data.ptrptr, align 8
  %list.elem.ptr = getelementptr inbounds i32, i32* %list.dataptr, i32 %0
  store i32 6, i32* %list.elem.ptr, align 4
  %2 = add i32 %0, 1
  store i32 %2, i32* %list.size.ptr, align 4
  %size_ptr25 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value26 = load i32, i32* %size_ptr25, align 4
  %calltmp027 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @.strliteral.5, i32 0, i32 0))
  %calltmp128 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %size_value26)
  %newline29 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %last = alloca i32, align 4
  %list.data.ptrptr30 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %list.size.ptr31 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 1
  %list.cap.ptr32 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 2
  %list.size33 = load i32, i32* %list.size.ptr31, align 4
  %list.newsize = sub i32 %list.size33, 1
  store i32 %list.newsize, i32* %list.size.ptr31, align 4
  %list.dataptr34 = load i32*, i32** %list.data.ptrptr30, align 8
  %list.elem.ptr35 = getelementptr inbounds i32, i32* %list.dataptr34, i32 %list.newsize
  %list.pop.value = load i32, i32* %list.elem.ptr35, align 4
  store i32 %list.pop.value, i32* %last, align 4
  store i32 %list.pop.value, i32* %last, align 4
  %last.load = load i32, i32* %last, align 4
  %calltmp036 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @.strliteral.6, i32 0, i32 0))
  %calltmp137 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %last.load)
  %newline38 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %size_ptr39 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value40 = load i32, i32* %size_ptr39, align 4
  %calltmp041 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.7, i32 0, i32 0))
  %calltmp142 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %size_value40)
  %newline43 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  ret void
}
