; ModuleID = 'mod'
source_filename = "mod"

@GLOBAL = external global i32
@fmt.int = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@fmt.float = private unnamed_addr constant [4 x i8] c"%f\0A\00", align 1
@fmt.str = private unnamed_addr constant [4 x i8] c"%s\0A\00", align 1
@fmt.bool = private unnamed_addr constant [4 x i8] c"%d\0A\00", align 1
@calltmp0 = private unnamed_addr constant [6 x i8] c"Sum: \00", align 1

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
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([6 x i8], [6 x i8]* @calltmp0, i32 0, i32 0))
  %calltmp13 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([4 x i8], [4 x i8]* @fmt.int, i32 0, i32 0), i32 %calltmp2)
  %i.load4 = load i32, i32* %i, align 4
  %addtmp5 = add i32 %i.load4, 1
  store i32 %addtmp5, i32* %i, align 4
  ret void
}

declare i32 @printf(i8*, ...)
