�T�v
�@�c�w���C�u������ VisualC# �Ŏg�����߂� DLL
�@( �ꉞC#�ȊO�Ŏg�p����ꍇ�ׂ̈� DxDLL.h �𓯍����Ă���܂��ADxDLL.dll �̒��Ɋ܂܂�Ă���
�@�@�֐��̈ꗗ���ڂ��Ă��܂� )

�g����

�@��������
�@�@�@DxLibDotNet.dll ���g�p����ꍇ

�@�@�@�@�P�DC# �̃v���W�F�N�g�̃t�H���_�́A���s�t�@�C�����쐬�����t�H���_
�@�@�@�@�@�@(�ʏ�� �u�v���W�F�N�g�̃t�H���_\bin\Debug�v �� �u�v���W�F�N�g�̃t�H���_\bin\Release�v)
�@�@�@�@�@�@�� DxLib.dll �� DxLibDotNet.dll ���R�s�[

�@�@�@�@�Q�DC# �̃v���W�F�N�g���J����
�@�@�@�@�@�@�u�v���W�F�N�g�v���u�Q�Ƃ̒ǉ��v���u�Q�ƃ^�u�v�ŁA�P�ŃR�s�[���� DxLibDotNet.dll ��I�����āuOK�v�{�^���B


�@�@�@DxDLL.cs ���g�p����ꍇ

�@�@�@�@�P�DC# �̃v���W�F�N�g�̃t�H���_�́A���s�t�@�C�����쐬�����t�H���_
�@�@�@�@�@�@(�ʏ�� �u�v���W�F�N�g�̃t�H���_\bin\Debug�v �� �u�v���W�F�N�g�̃t�H���_\bin\Release�v)
�@�@�@�@�@�@�� DxLib.dll ���R�s�[

�@�@�@�@�Q�DC# �̃v���W�F�N�g���J����
�@�@�@�@�@�@�u�v���W�F�N�g�v���u�������ڂ̒ǉ��v�ŁADxDLL.cs ���u�ǉ��v�B



�@���v���O�����Ŏ��ۂɎg����
�@�@�@�c�w���C�u�������g�p����\�[�X�� using DxLibDLL; �������B
�@�@�@��́A��{�I�ɂb����ł̂c�w���C�u�����̊֐�����}�N����`�̑O�� DX. ��t�������̂ƂȂ�܂��B
�@�@�@(DX_BLENDMODE_ALPHA ���� DX ���Q�񑱂��ĕςł����ADX.DX_BLENDMODE_ALPHA �ƂȂ�܂�)

�@�@��F
�@�@�@�@�@int GrHandle = DX.LoadGraph( "test1.bmp" );
�@�@�@�@�@DX.SetDrawBlendMode( DX.DX_BLENDMODE_ALPHA, 128 );
�@�@�@�@�@DX.DrawGraph( 0, 0, GrHandle, DX.TRUE );


�@�@�@LoadDivGraph ���� int �^�̃|�C���^��n�����̂́Aout int HandleBuf �̂悤�ɒ�`����Ă��܂��B
�@�@�@�Ƃ������A������ȊO�̃|�C���^�͑S�� out �œn���悤�ɂȂ��Ă��܂��B

�@�@��F
�@�@�@�@�@int[] Handle = new int[25];
�@�@�@�@�@DX.LoadDivGraph( "test2.bmp", 25, 5, 5, 10, 10, out Handle[0] );

�@�@�@��L�ȊO�̕��@��̈Ⴂ�͂���܂���̂ŁA��{�I�ɂ͂b����ł̂c�w���C�u�����̃��t�@�����X��
�@�@�@���Q�Ƃ��������B



�@���g���Ȃ��֐���
�@�@�@��{�I�Ɂu�ψ����̊֐��v�uvoid �^�̃|�C���^�������Ŏ��֐��v�u�R�[���o�b�N�֐���
�@�@�@�����Ŏ��֐��v���g���܂���B(�Ȃ̂ŒʐM�@�\�͎g���܂���E�E�E)
�@�@�@�܂��A�|�C���^��Ԃ��֐���|�C���^���܂܂�Ă���\���̂������֐����g���܂���̂ŁA
�@�@�@����J�֐��͂��Ȃ�̐����g���Ȃ��Ȃ��Ă��܂��B

�@�@�@(���J�֐��Ŏg�p�ł��Ȃ�����)
�@�@�@���f���������֐��̈ꕔ
�@�@�@DrawFormatString
�@�@�@GetDrawFormatStringWidth
�@�@�@DrawFormatStringToHandle
�@�@�@GetDrawFormatStringWidthToHandle
�@�@�@SetDataToMask
�@�@�@DrawMaskToDirectData
�@�@�@DrawFillMaskToDirectData
�@�@�@printfDx
�@�@�@NetWorkSend
�@�@�@NetWorkRecv
�@�@�@NetWorkRecvToPeek
�@�@�@CreateGraphFromMem
�@�@�@LoadSoundMemByMemImage
�@�@�@GraphLock
�@�@�@GraphUnLock

�@�@�@<�]�k>
�@�@�@�@��L�u�g�p�ł��Ȃ��֐��v�̓��A�v���W�F�N�g�́u�����t�R���p�C���V���{���v�ɁuDX_USE_UNSAFE�v��
�@�@�@�@��`���āA���u�A���Z�[�t�R�[�h�̋��v��L���ɂ���Ɗ���g����֐��������܂��B
�@�@�@�@������������܂����� DxDLL.cs �̒����uunsafe�v��uDX_USE_UNSAFE�v�Ō������Ă݂Ă��������B


�g�p�̋���
�@��{�I�ɂb����łc�w���C�u�����Ɠ����ł��B


���J�T�C�g
�@http://homepage2.nifty.com/natupaji/DxLib/index.html




