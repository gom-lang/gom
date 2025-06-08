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

declare i32 @printf(i8*, ...)

declare i8* @malloc(i32)

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
  %i.load = load i32, i32* %i, align 4
  br label %loop

loop:                                             ; preds = %loopupdate, %entry
  %i.load11 = load i32, i32* %i, align 4
  %size_ptr12 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value = load i32, i32* %size_ptr12, align 4
  %lttmp = icmp slt i32 %i.load11, %size_value
  br i1 %lttmp, label %loopbody, label %afterloop

loopbody:                                         ; preds = %loop
  %i.load13 = load i32, i32* %i, align 4
  %i.load14 = load i32, i32* %i, align 4
  %data_ptr_ptr15 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %data_ptr = load i32*, i32** %data_ptr_ptr15, align 8
  %element_ptr16 = getelementptr inbounds i32, i32* %data_ptr, i32 %i.load14
  %element_load = load i32, i32* %element_ptr16, align 4
  %calltmp017 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([17 x i8], [17 x i8]* @.strliteral.2, i32 0, i32 0))
  %calltmp118 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %i.load13)
  %calltmp2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.strliteral.3, i32 0, i32 0))
  %calltmp3 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %element_load)
  %newline19 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate

loopupdate:                                       ; preds = %loopbody
  %i.load20 = load i32, i32* %i, align 4
  %addtmp = add i32 %i.load20, 1
  store i32 %addtmp, i32* %i, align 4
  br label %loop

afterloop:                                        ; preds = %loop
  ret void
}
