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
@.strliteral.10 = private unnamed_addr constant [20 x i8] c"After push length: \00", align 1
@.strliteral.11 = private unnamed_addr constant [19 x i8] c"After pop length: \00", align 1

declare i32 @printf(i8*, ...)

declare i8* @malloc(i32)

declare i8* @realloc(i8*, i32)

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
  br label %loop

loop:                                             ; preds = %loopupdate, %entry
  %i.load = load i32, i32* %i, align 4
  %size_ptr5 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value = load i32, i32* %size_ptr5, align 4
  %lttmp = icmp slt i32 %i.load, %size_value
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
  %statusList = alloca %StatusList, align 8
  %data_ptr_ptr11 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 0
  %size_ptr12 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 1
  %capacity_ptr13 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 2
  store i32 16, i32* %capacity_ptr13, align 4
  store i32 3, i32* %size_ptr12, align 4
  %malloc_call14 = call i8* @malloc(i32 128)
  %data_alloca15 = bitcast i8* %malloc_call14 to %Status*
  store %Status* %data_alloca15, %Status** %data_ptr_ptr11, align 8
  %Status_instance = alloca %Status, align 8
  %fieldptr = getelementptr %Status, %Status* %Status_instance, i32 0, i32 0
  store i32 200, i32* %fieldptr, align 4
  %fieldptr16 = getelementptr %Status, %Status* %Status_instance, i32 0, i32 1
  store i1 true, i1* %fieldptr16, align 1
  %element_load17 = load %Status, %Status* %Status_instance, align 4
  %element_ptr18 = getelementptr inbounds %Status, %Status* %data_alloca15, i32 0
  store %Status %element_load17, %Status* %element_ptr18, align 4
  %Status_instance19 = alloca %Status, align 8
  %fieldptr20 = getelementptr %Status, %Status* %Status_instance19, i32 0, i32 0
  store i32 404, i32* %fieldptr20, align 4
  %fieldptr21 = getelementptr %Status, %Status* %Status_instance19, i32 0, i32 1
  store i1 false, i1* %fieldptr21, align 1
  %element_load22 = load %Status, %Status* %Status_instance19, align 4
  %element_ptr23 = getelementptr inbounds %Status, %Status* %data_alloca15, i32 1
  store %Status %element_load22, %Status* %element_ptr23, align 4
  %Status_instance24 = alloca %Status, align 8
  %fieldptr25 = getelementptr %Status, %Status* %Status_instance24, i32 0, i32 0
  store i32 500, i32* %fieldptr25, align 4
  %fieldptr26 = getelementptr %Status, %Status* %Status_instance24, i32 0, i32 1
  store i1 false, i1* %fieldptr26, align 1
  %element_load27 = load %Status, %Status* %Status_instance24, align 4
  %element_ptr28 = getelementptr inbounds %Status, %Status* %data_alloca15, i32 2
  store %Status %element_load27, %Status* %element_ptr28, align 4
  %j = alloca i32, align 4
  store i32 0, i32* %j, align 4
  store i32 0, i32* %j, align 4
  br label %loop29

loop29:                                           ; preds = %loopupdate31, %afterloop
  %j.load = load i32, i32* %j, align 4
  %size_ptr33 = getelementptr %StatusList, %StatusList* %statusList, i32 0, i32 1
  %size_value34 = load i32, i32* %size_ptr33, align 4
  %lttmp35 = icmp slt i32 %j.load, %size_value34
  br i1 %lttmp35, label %loopbody30, label %afterloop32

loopbody30:                                       ; preds = %loop29
  %status = alloca %Status, align 8
  %j.load36 = load i32, i32* %j, align 4
  %data_ptr_ptr37 = getelementptr inbounds %StatusList, %StatusList* %statusList, i32 0, i32 0
  %data_ptr38 = load %Status*, %Status** %data_ptr_ptr37, align 8
  %element_ptr39 = getelementptr inbounds %Status, %Status* %data_ptr38, i32 %j.load36
  %element_load40 = load %Status, %Status* %element_ptr39, align 4
  store %Status %element_load40, %Status* %status, align 4
  %j.load41 = load i32, i32* %j, align 4
  %fieldptr42 = getelementptr %Status, %Status* %status, i32 0, i32 0
  %fieldload = load i32, i32* %fieldptr42, align 4
  %fieldptr43 = getelementptr %Status, %Status* %status, i32 0, i32 1
  %fieldload44 = load i1, i1* %fieldptr43, align 1
  %calltmp045 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.2, i32 0, i32 0))
  %calltmp146 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %j.load41)
  %calltmp247 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([13 x i8], [13 x i8]* @.strliteral.3, i32 0, i32 0))
  %calltmp348 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload)
  %calltmp4 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([12 x i8], [12 x i8]* @.strliteral.4, i32 0, i32 0))
  %calltmp5 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.bool, i32 0, i32 0), i1 %fieldload44)
  %calltmp6 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.5, i32 0, i32 0))
  %newline49 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate31

loopupdate31:                                     ; preds = %loopbody30
  %j.load50 = load i32, i32* %j, align 4
  %addtmp51 = add i32 %j.load50, 1
  store i32 %addtmp51, i32* %j, align 4
  br label %loop29

afterloop32:                                      ; preds = %loop29
  %pairs = alloca %Pairs, align 8
  %data_ptr_ptr52 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 0
  %size_ptr53 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 1
  %capacity_ptr54 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 2
  store i32 16, i32* %capacity_ptr54, align 4
  store i32 5, i32* %size_ptr53, align 4
  %malloc_call55 = call i8* @malloc(i32 128)
  %data_alloca56 = bitcast i8* %malloc_call55 to { i32, i32 }*
  store { i32, i32 }* %data_alloca56, { i32, i32 }** %data_ptr_ptr52, align 8
  %tuple = alloca { i32, i32 }, align 8
  %fieldptr57 = getelementptr { i32, i32 }, { i32, i32 }* %tuple, i32 0, i32 0
  store i32 1, i32* %fieldptr57, align 4
  %fieldptr58 = getelementptr { i32, i32 }, { i32, i32 }* %tuple, i32 0, i32 1
  store i32 2, i32* %fieldptr58, align 4
  %element_load59 = load { i32, i32 }, { i32, i32 }* %tuple, align 4
  %element_ptr60 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca56, i32 0
  store { i32, i32 } %element_load59, { i32, i32 }* %element_ptr60, align 4
  %tuple61 = alloca { i32, i32 }, align 8
  %fieldptr62 = getelementptr { i32, i32 }, { i32, i32 }* %tuple61, i32 0, i32 0
  store i32 3, i32* %fieldptr62, align 4
  %fieldptr63 = getelementptr { i32, i32 }, { i32, i32 }* %tuple61, i32 0, i32 1
  store i32 4, i32* %fieldptr63, align 4
  %element_load64 = load { i32, i32 }, { i32, i32 }* %tuple61, align 4
  %element_ptr65 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca56, i32 1
  store { i32, i32 } %element_load64, { i32, i32 }* %element_ptr65, align 4
  %tuple66 = alloca { i32, i32 }, align 8
  %fieldptr67 = getelementptr { i32, i32 }, { i32, i32 }* %tuple66, i32 0, i32 0
  store i32 5, i32* %fieldptr67, align 4
  %fieldptr68 = getelementptr { i32, i32 }, { i32, i32 }* %tuple66, i32 0, i32 1
  store i32 6, i32* %fieldptr68, align 4
  %element_load69 = load { i32, i32 }, { i32, i32 }* %tuple66, align 4
  %element_ptr70 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca56, i32 2
  store { i32, i32 } %element_load69, { i32, i32 }* %element_ptr70, align 4
  %tuple71 = alloca { i32, i32 }, align 8
  %fieldptr72 = getelementptr { i32, i32 }, { i32, i32 }* %tuple71, i32 0, i32 0
  store i32 7, i32* %fieldptr72, align 4
  %fieldptr73 = getelementptr { i32, i32 }, { i32, i32 }* %tuple71, i32 0, i32 1
  store i32 8, i32* %fieldptr73, align 4
  %element_load74 = load { i32, i32 }, { i32, i32 }* %tuple71, align 4
  %element_ptr75 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca56, i32 3
  store { i32, i32 } %element_load74, { i32, i32 }* %element_ptr75, align 4
  %tuple76 = alloca { i32, i32 }, align 8
  %fieldptr77 = getelementptr { i32, i32 }, { i32, i32 }* %tuple76, i32 0, i32 0
  store i32 9, i32* %fieldptr77, align 4
  %fieldptr78 = getelementptr { i32, i32 }, { i32, i32 }* %tuple76, i32 0, i32 1
  store i32 10, i32* %fieldptr78, align 4
  %element_load79 = load { i32, i32 }, { i32, i32 }* %tuple76, align 4
  %element_ptr80 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_alloca56, i32 4
  store { i32, i32 } %element_load79, { i32, i32 }* %element_ptr80, align 4
  %k = alloca i32, align 4
  store i32 0, i32* %k, align 4
  store i32 0, i32* %k, align 4
  br label %loop81

loop81:                                           ; preds = %loopupdate83, %afterloop32
  %k.load = load i32, i32* %k, align 4
  %size_ptr85 = getelementptr %Pairs, %Pairs* %pairs, i32 0, i32 1
  %size_value86 = load i32, i32* %size_ptr85, align 4
  %lttmp87 = icmp slt i32 %k.load, %size_value86
  br i1 %lttmp87, label %loopbody82, label %afterloop84

loopbody82:                                       ; preds = %loop81
  %pair = alloca { i32, i32 }, align 8
  %k.load88 = load i32, i32* %k, align 4
  %data_ptr_ptr89 = getelementptr inbounds %Pairs, %Pairs* %pairs, i32 0, i32 0
  %data_ptr90 = load { i32, i32 }*, { i32, i32 }** %data_ptr_ptr89, align 8
  %element_ptr91 = getelementptr inbounds { i32, i32 }, { i32, i32 }* %data_ptr90, i32 %k.load88
  %element_load92 = load { i32, i32 }, { i32, i32 }* %element_ptr91, align 4
  store { i32, i32 } %element_load92, { i32, i32 }* %pair, align 4
  %k.load93 = load i32, i32* %k, align 4
  %fieldptr94 = getelementptr { i32, i32 }, { i32, i32 }* %pair, i32 0, i32 0
  %fieldload95 = load i32, i32* %fieldptr94, align 4
  %fieldptr96 = getelementptr { i32, i32 }, { i32, i32 }* %pair, i32 0, i32 1
  %fieldload97 = load i32, i32* %fieldptr96, align 4
  %calltmp098 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @.strliteral.6, i32 0, i32 0))
  %calltmp199 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %k.load93)
  %calltmp2100 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([7 x i8], [7 x i8]* @.strliteral.7, i32 0, i32 0))
  %calltmp3101 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload95)
  %calltmp4102 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.8, i32 0, i32 0))
  %calltmp5103 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %fieldload97)
  %calltmp6104 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @.strliteral.9, i32 0, i32 0))
  %newline105 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  br label %loopupdate83

loopupdate83:                                     ; preds = %loopbody82
  %k.load106 = load i32, i32* %k, align 4
  %addtmp107 = add i32 %k.load106, 1
  store i32 %addtmp107, i32* %k, align 4
  br label %loop81

afterloop84:                                      ; preds = %loop81
  %list.data.ptrptr = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %list.size.ptr = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 1
  %list.cap.ptr = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 2
  %list.size = load i32, i32* %list.size.ptr, align 4
  %list.cap = load i32, i32* %list.cap.ptr, align 4
  %cap.iszero = icmp eq i32 %list.cap, 0
  br i1 %cap.iszero, label %list.needinit, label %list.growthcheck

list.needinit:                                    ; preds = %afterloop84
  %list.init.malloc = call i8* @malloc(i32 64)
  %list.init.dataptr = bitcast i8* %list.init.malloc to i32*
  store i32* %list.init.dataptr, i32** %list.data.ptrptr, align 8
  store i32 16, i32* %list.cap.ptr, align 4
  br label %list.growthcheck

list.growthcheck:                                 ; preds = %list.needinit, %afterloop84
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
  store i32 42, i32* %list.elem.ptr, align 4
  %2 = add i32 %0, 1
  store i32 %2, i32* %list.size.ptr, align 4
  %size_ptr108 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value109 = load i32, i32* %size_ptr108, align 4
  %calltmp0110 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([20 x i8], [20 x i8]* @.strliteral.10, i32 0, i32 0))
  %calltmp1111 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %size_value109)
  %newline112 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  %list.data.ptrptr113 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 0
  %list.size.ptr114 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 1
  %list.cap.ptr115 = getelementptr inbounds %Numbers, %Numbers* %numbers, i32 0, i32 2
  %list.size116 = load i32, i32* %list.size.ptr114, align 4
  %list.newsize = sub i32 %list.size116, 1
  store i32 %list.newsize, i32* %list.size.ptr114, align 4
  %list.dataptr117 = load i32*, i32** %list.data.ptrptr113, align 8
  %list.elem.ptr118 = getelementptr inbounds i32, i32* %list.dataptr117, i32 %list.newsize
  %list.pop.value = load i32, i32* %list.elem.ptr118, align 4
  %size_ptr119 = getelementptr %Numbers, %Numbers* %numbers, i32 0, i32 1
  %size_value120 = load i32, i32* %size_ptr119, align 4
  %calltmp0121 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([19 x i8], [19 x i8]* @.strliteral.11, i32 0, i32 0))
  %calltmp1122 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([3 x i8], [3 x i8]* @fmt.int, i32 0, i32 0), i32 %size_value120)
  %newline123 = call i32 (i8*, ...) @printf(i8* getelementptr inbounds ([2 x i8], [2 x i8]* @newline, i32 0, i32 0))
  ret void
}
