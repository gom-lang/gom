; ModuleID = 'mod'
source_filename = "mod"

%Numbers = type { i32*, i32, i32 }

@.strliteral = private unnamed_addr constant [9 x i8] c"numbers[\00", align 1
@.strliteral.1 = private unnamed_addr constant [5 x i8] c"] = \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1

declare i32 @printf(i8*, ...)

declare i8* @malloc(i32)

define void @main() {
entry:
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
  %element_ptr1 = getelementptr inbounds i32, i32* %data_alloca, i32 1
  store i32 2, i32* %element_ptr1, align 4
  %element_ptr2 = getelementptr inbounds i32, i32* %data_alloca, i32 2
  store i32 3, i32* %element_ptr2, align 4
  %element_ptr3 = getelementptr inbounds i32, i32* %data_alloca, i32 3
  store i32 4, i32* %element_ptr3, align 4
  %element_ptr4 = getelementptr inbounds i32, i32* %data_alloca, i32 4
  store i32 5, i32* %element_ptr4, align 4
  %i = alloca i32, align 4
  store i32 0, i32* %i, align 4
  store i32 0, i32* %i, align 4
  %i.load = load i32, i32* %i, align 4
  br label %loop

loop:                                             ; preds = %loopupdate, %entry
  %i.load5 = load i32, i32* %i, align 4
  %lttmp = icmp slt i32 %i.load5, 5
  br i1 %lttmp, label %loopbody, label %afterloop

loopbody:                                         ; preds = %loop
  %i.load6 = load i32, i32* %i, align 4
  %i.load7 = load i32, i32* %i, align 4
  %data_ptr_ptr8 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %data_ptr = load i32*, i32** %data_ptr_ptr8, align 8
  %element_ptr9 = getelementptr inbounds i32, i32* %data_ptr, i32 %i.load7
  %element_load = load i32, i32* %element_ptr9, align 4
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @.strliteral, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %i.load6)
  %calltmp2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.strliteral.1, i32 0, i32 0))
  %calltmp3 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %element_load)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate

loopupdate:                                       ; preds = %loopbody
  %i.load10 = load i32, i32* %i, align 4
  %addtmp = add i32 %i.load10, 1
  store i32 %addtmp, i32* %i, align 4
  br label %loop

afterloop:                                        ; preds = %loop
  ret void
}
