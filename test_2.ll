; ModuleID = 'mod'
source_filename = "mod"

@GLOBAL = external global i32
@fmt.int = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@fmt.float = private unnamed_addr constant [4 x i8] c"%f\0A\00", align 1
@fmt.str = private unnamed_addr constant [4 x i8] c"%s\0A\00", align 1
@fmt.bool = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@calltmp0 = private unnamed_addr constant [9 x i8] c"i is 3\\n\00", align 1
@calltmp0.1 = private unnamed_addr constant [13 x i8] c"i is not 3\\n\00", align 1
@calltmp0.2 = private unnamed_addr constant [6 x i8] c"i is \00", align 1

define i32 @square(i32 %0) {
entry:
  %1 = alloca i32, align 4
  store i32 %0, i32* %1, align 4
  %x.load = load i32, i32* %1, align 4
  %x.load1 = load i32, i32* %1, align 4
  %multmp = mul i32 %x.load, %x.load1
  ret i32 %multmp
}

define i32 @add(i32 %0, i32 %1) {
entry:
  %2 = alloca i32, align 4
  store i32 %0, i32* %2, align 4
  %3 = alloca i32, align 4
  store i32 %1, i32* %3, align 4
  %a.load = load i32, i32* %2, align 4
  %b.load = load i32, i32* %3, align 4
  %addtmp = add i32 %a.load, %b.load
  ret i32 %addtmp
}

define void @main() {
entry:
  %a = alloca i32, align 4
  store i32 3, i32* %a, align 4
  %b = alloca i32, align 4
  store i32 2, i32* %b, align 4
  %b.load = load i32, i32* %b, align 4
  %divtmp = sdiv i32 %b.load, 2
  %addtmp = add i32 1, %divtmp
  %calltmp = call i32 @add(i32 1, i32 %addtmp)
  store i32 2, i32* %a, align 4
  %sq = alloca i32, align 4
  %a.load = load i32, i32* %a, align 4
  %calltmp1 = call i32 @square(i32 %a.load)
  store i32 %calltmp1, i32* %sq, align 4
  %i = alloca i32, align 4
  store i32 3, i32* %i, align 4
  %i.load = load i32, i32* %i, align 4
  %calltmp2 = call i32 @add(i32 %i.load, i32 1)
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @fmt.int, i32 0, i32 0), i32 %calltmp2)
  %i.load3 = load i32, i32* %i, align 4
  %addtmp4 = add i32 %i.load3, 1
  store i32 %addtmp4, i32* %i, align 4
  %i.load5 = load i32, i32* %i, align 4
  %eqtmp = icmp eq i32 %i.load5, 3
  br i1 %eqtmp, label %then, label %else

then:                                             ; preds = %entry
  %calltmp06 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @calltmp0, i32 0, i32 0))
  br label %merge

else:                                             ; preds = %entry
  %calltmp07 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @calltmp0.1, i32 0, i32 0))
  %i.load8 = load i32, i32* %i, align 4
  %calltmp09 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @calltmp0.2, i32 0, i32 0))
  %calltmp110 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @fmt.int, i32 0, i32 0), i32 %i.load8)
  br label %merge

merge:                                            ; preds = %else, %then
  ret void
}

declare i32 @printf(i8*, ...)
