; ModuleID = 'mod'
source_filename = "mod"

%Numbers = type { i32*, i32, i32 }
%StatusList = type { %Status*, i32, i32 }
%Status = type { i32, i1 }
%Pairs = type { { i32, i32 }*, i32, i32 }

@.strliteral = private unnamed_addr constant [9 x i8] c"numbers[\00", align 1
@.strliteral.1 = private unnamed_addr constant [5 x i8] c"] = \00", align 1
@fmt.int = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@newline = private unnamed_addr constant [2 x i8] c"\0A\00", align 1
@.strliteral.2 = private unnamed_addr constant [12 x i8] c"statusList[\00", align 1
@.strliteral.3 = private unnamed_addr constant [13 x i8] c"] = { code: \00", align 1
@.strliteral.4 = private unnamed_addr constant [12 x i8] c", success: \00", align 1
@.strliteral.5 = private unnamed_addr constant [3 x i8] c" }\00", align 1
@fmt.bool = private unnamed_addr constant [3 x i8] c"%d\00", align 1
@.strliteral.6 = private unnamed_addr constant [7 x i8] c"pairs[\00", align 1
@.strliteral.7 = private unnamed_addr constant [7 x i8] c"] = { \00", align 1
@.strliteral.8 = private unnamed_addr constant [3 x i8] c", \00", align 1
@.strliteral.9 = private unnamed_addr constant [3 x i8] c" }\00", align 1

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
  %size_ptr6 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value = load i32, i32* %size_ptr6, align 4
  %lttmp = icmp slt i32 %i.load5, %size_value
  br i1 %lttmp, label %loopbody, label %afterloop

loopbody:                                         ; preds = %loop
  %i.load7 = load i32, i32* %i, align 4
  %i.load8 = load i32, i32* %i, align 4
  %data_ptr_ptr9 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %data_ptr = load i32*, i32** %data_ptr_ptr9, align 8
  %element_ptr10 = getelementptr inbounds i32, i32* %data_ptr, i32 %i.load8
  %element_load = load i32, i32* %element_ptr10, align 4
  %calltmp0 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([9 x i8], [9 x i8]* @.strliteral, i32 0, i32 0))
  %calltmp1 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %i.load7)
  %calltmp2 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([5 x i8], [5 x i8]* @.strliteral.1, i32 0, i32 0))
  %calltmp3 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %element_load)
  %newline = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate

loopupdate:                                       ; preds = %loopbody
  %i.load11 = load i32, i32* %i, align 4
  %addtmp = add i32 %i.load11, 1
  store i32 %addtmp, i32* %i, align 4
  br label %loop

afterloop:                                        ; preds = %loop
  %statusList = alloca %StatusList, align 8
  %data_ptr_ptr12 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 0
  %size_ptr13 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 1
  %capacity_ptr14 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 2
  store i32 16, i32* %capacity_ptr14, align 4
  store i32 3, i32* %size_ptr13, align 4
  %malloc_call15 = call i8* @malloc(i32 128)
  %data_alloca16 = bitcast i8* %malloc_call15 to %Status*
  store %Status* %data_alloca16, %Status** %data_ptr_ptr12, align 8
  %Status_instance = alloca %Status, align 8
  %fieldptr = getelementptr %Status, %Status* %Status_instance, i32 0, i32 0
  store i32 200, i32* %fieldptr, align 4
  %fieldptr17 = getelementptr %Status, %Status* %Status_instance, i32 0, i32 1
  store i1 true, i1* %fieldptr17, align 1
  %element_load18 = load %Status, %Status* %Status_instance, align 4
  %element_ptr19 = getelementptr inbounds %Status, %Status* %data_alloca16, i32 0
  store %Status %element_load18, %Status* %element_ptr19, align 4
  %Status_instance20 = alloca %Status, align 8
  %fieldptr21 = getelementptr %Status, %Status* %Status_instance20, i32 0, i32 0
  store i32 404, i32* %fieldptr21, align 4
  %fieldptr22 = getelementptr %Status, %Status* %Status_instance20, i32 0, i32 1
  store i1 false, i1* %fieldptr22, align 1
  %element_load23 = load %Status, %Status* %Status_instance20, align 4
  %element_ptr24 = getelementptr inbounds %Status, %Status* %data_alloca16, i32 1
  store %Status %element_load23, %Status* %element_ptr24, align 4
  %Status_instance25 = alloca %Status, align 8
  %fieldptr26 = getelementptr %Status, %Status* %Status_instance25, i32 0, i32 0
  store i32 500, i32* %fieldptr26, align 4
  %fieldptr27 = getelementptr %Status, %Status* %Status_instance25, i32 0, i32 1
  store i1 false, i1* %fieldptr27, align 1
  %element_load28 = load %Status, %Status* %Status_instance25, align 4
  %element_ptr29 = getelementptr inbounds %Status, %Status* %data_alloca16, i32 2
  store %Status %element_load28, %Status* %element_ptr29, align 4
  %j = alloca i32, align 4
  store i32 0, i32* %j, align 4
  store i32 0, i32* %j, align 4
  %j.load = load i32, i32* %j, align 4
  br label %loop30

loop30:                                           ; preds = %loopupdate32, %afterloop
  %j.load34 = load i32, i32* %j, align 4
  %size_ptr35 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 1
  %size_value36 = load i32, i32* %size_ptr35, align 4
  %lttmp37 = icmp slt i32 %j.load34, %size_value36
  br i1 %lttmp37, label %loopbody31, label %afterloop33

loopbody31:                                       ; preds = %loop30
  %status = alloca %Status, align 8
  %j.load38 = load i32, i32* %j, align 4
  %data_ptr_ptr39 = getelementptr inbounds %StatusList, %StatusList* %statusList, i32 0, i32 0
  %data_ptr40 = load %Status*, %Status** %data_ptr_ptr39, align 8
  %element_ptr41 = getelementptr inbounds %Status, %Status* %data_ptr40, i32 %j.load38
  %element_load42 = load %Status, %Status* %element_ptr41, align 4
  store %Status %element_load42, %Status* %status, align 4
  %j.load43 = load i32, i32* %j, align 4
  %fieldptr44 = getelementptr %Status, %Status* %status, i32 0, i32 0
  %fieldload = load i32, i32* %fieldptr44, align 4
  %fieldptr45 = getelementptr %Status, %Status* %status, i32 0, i32 1
  %fieldload46 = load i1, i1* %fieldptr45, align 1
  %calltmp047 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.2, i32 0, i32 0))
  %calltmp148 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %j.load43)
  %calltmp249 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @.strliteral.3, i32 0, i32 0))
  %calltmp350 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload)
  %calltmp4 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.4, i32 0, i32 0))
  %calltmp5 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i32 0, i32 0), i1 %fieldload46)
  %calltmp6 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.5, i32 0, i32 0))
  %newline51 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate32

loopupdate32:                                     ; preds = %loopbody31
  %j.load52 = load i32, i32* %j, align 4
  %addtmp53 = add i32 %j.load52, 1
  store i32 %addtmp53, i32* %j, align 4
  br label %loop30

afterloop33:                                      ; preds = %loop30
  %pairs = alloca %Pairs, align 8
  %data_ptr_ptr54 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 0
  %size_ptr55 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 1
  %capacity_ptr56 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 2
  store i32 16, i32* %capacity_ptr56, align 4
  store i32 5, i32* %size_ptr55, align 4
  %malloc_call57 = call i8* @malloc(i32 128)
  %data_alloca58 = bitcast i8* %malloc_call57 to { i32, i32 }*
  store { i32, i32 }* %data_alloca58, { i32, i32 }** %data_ptr_ptr54, align 8
  %tuple = alloca { i32, i32 }, align 8
  %fieldptr59 = getelementptr { i32, i32 }, { i32, i32 }* %tuple, i32 0, i32 0
  store i32 1, i32* %fieldptr59, align 4
  %fieldptr60 = getelementptr { i32, i32 }, { i32, i32 }* %tuple, i32 0, i32 1
  store i32 2, i32* %fieldptr60, align 4
  %element_load61 = load { i32, i32 }, { i32, i32 }* %tuple, align 4
  %element_ptr62 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca58, i32 0
  store { i32, i32 } %element_load61, { i32, i32 }* %element_ptr62, align 4
  %tuple63 = alloca { i32, i32 }, align 8
  %fieldptr64 = getelementptr { i32, i32 }, { i32, i32 }* %tuple63, i32 0, i32 0
  store i32 3, i32* %fieldptr64, align 4
  %fieldptr65 = getelementptr { i32, i32 }, { i32, i32 }* %tuple63, i32 0, i32 1
  store i32 4, i32* %fieldptr65, align 4
  %element_load66 = load { i32, i32 }, { i32, i32 }* %tuple63, align 4
  %element_ptr67 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca58, i32 1
  store { i32, i32 } %element_load66, { i32, i32 }* %element_ptr67, align 4
  %tuple68 = alloca { i32, i32 }, align 8
  %fieldptr69 = getelementptr { i32, i32 }, { i32, i32 }* %tuple68, i32 0, i32 0
  store i32 5, i32* %fieldptr69, align 4
  %fieldptr70 = getelementptr { i32, i32 }, { i32, i32 }* %tuple68, i32 0, i32 1
  store i32 6, i32* %fieldptr70, align 4
  %element_load71 = load { i32, i32 }, { i32, i32 }* %tuple68, align 4
  %element_ptr72 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca58, i32 2
  store { i32, i32 } %element_load71, { i32, i32 }* %element_ptr72, align 4
  %tuple73 = alloca { i32, i32 }, align 8
  %fieldptr74 = getelementptr { i32, i32 }, { i32, i32 }* %tuple73, i32 0, i32 0
  store i32 7, i32* %fieldptr74, align 4
  %fieldptr75 = getelementptr { i32, i32 }, { i32, i32 }* %tuple73, i32 0, i32 1
  store i32 8, i32* %fieldptr75, align 4
  %element_load76 = load { i32, i32 }, { i32, i32 }* %tuple73, align 4
  %element_ptr77 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca58, i32 3
  store { i32, i32 } %element_load76, { i32, i32 }* %element_ptr77, align 4
  %tuple78 = alloca { i32, i32 }, align 8
  %fieldptr79 = getelementptr { i32, i32 }, { i32, i32 }* %tuple78, i32 0, i32 0
  store i32 9, i32* %fieldptr79, align 4
  %fieldptr80 = getelementptr { i32, i32 }, { i32, i32 }* %tuple78, i32 0, i32 1
  store i32 10, i32* %fieldptr80, align 4
  %element_load81 = load { i32, i32 }, { i32, i32 }* %tuple78, align 4
  %element_ptr82 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca58, i32 4
  store { i32, i32 } %element_load81, { i32, i32 }* %element_ptr82, align 4
  %k = alloca i32, align 4
  store i32 0, i32* %k, align 4
  store i32 0, i32* %k, align 4
  %k.load = load i32, i32* %k, align 4
  br label %loop83

loop83:                                           ; preds = %loopupdate85, %afterloop33
  %k.load87 = load i32, i32* %k, align 4
  %size_ptr88 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 1
  %size_value89 = load i32, i32* %size_ptr88, align 4
  %lttmp90 = icmp slt i32 %k.load87, %size_value89
  br i1 %lttmp90, label %loopbody84, label %afterloop86

loopbody84:                                       ; preds = %loop83
  %pair = alloca { i32, i32 }, align 8
  %k.load91 = load i32, i32* %k, align 4
  %data_ptr_ptr92 = getelementptr inbounds %Pairs, %Pairs* %pairs, i32 0, i32 0
  %data_ptr93 = load { i32, i32 }*, { i32, i32 }** %data_ptr_ptr92, align 8
  %element_ptr94 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_ptr93, i32 %k.load91
  %element_load95 = load { i32, i32 }, { i32, i32 }* %element_ptr94, align 4
  store { i32, i32 } %element_load95, { i32, i32 }* %pair, align 4
  %k.load96 = load i32, i32* %k, align 4
  %fieldptr97 = getelementptr { i32, i32 }, { i32, i32 }* %pair, i32 0, i32 0
  %fieldload98 = load i32, i32* %fieldptr97, align 4
  %fieldptr99 = getelementptr { i32, i32 }, { i32, i32 }* %pair, i32 0, i32 1
  %fieldload100 = load i32, i32* %fieldptr99, align 4
  %calltmp0101 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @.strliteral.6, i32 0, i32 0))
  %calltmp1102 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %k.load96)
  %calltmp2103 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @.strliteral.7, i32 0, i32 0))
  %calltmp3104 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload98)
  %calltmp4105 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.8, i32 0, i32 0))
  %calltmp5106 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload100)
  %calltmp6107 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.9, i32 0, i32 0))
  %newline108 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate85

loopupdate85:                                     ; preds = %loopbody84
  %k.load109 = load i32, i32* %k, align 4
  %addtmp110 = add i32 %k.load109, 1
  store i32 %addtmp110, i32* %k, align 4
  br label %loop83

afterloop86:                                      ; preds = %loop83
  ret void
}
